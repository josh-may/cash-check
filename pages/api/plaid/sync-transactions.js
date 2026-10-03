import { plaidClient, prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { shouldExcludeTransaction } from "../../../lib/transaction-filters";

const getUtcDateBoundary = (year, month, day) => new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
const formatPlaidDate = (year, month, day) => {
  const date = new Date(year, month, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find user by email (consistent with exchange_public_token)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Support filtering by specific plaidItemId for isolated syncing
    const { plaidItemId } = req.query;

    // Get user's Plaid items with Prisma
    const plaidItems = await prisma.plaidItem.findMany({
      where: plaidItemId
        ? { id: plaidItemId, userId: user.id }  // Remove parseInt - ID is a string
        : { userId: user.id },
    });

    if (plaidItems.length === 0) {
      return res.json({
        success: true,
        message: "No Plaid items found",
        transactionCount: 0
      });
    }

    // Determine if this is an initial sync (account was just connected).
    // Check if any targeted PlaidItem was created within the last 5 minutes.
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const isInitialSync = plaidItems.some(item =>
      item.createdAt && new Date(item.createdAt) > fiveMinutesAgo
    );

    // For initial sync: fetch current month.
    // For regular sync (cron job): fetch last month.
    //
    // Note: when a specific `plaidItemId` is provided (e.g. after a relink),
    // users expect to see current-month transactions immediately.
    const forceCurrentMonth = Boolean(plaidItemId);
    let targetMonthStart, targetMonthEnd, plaidStartDate, plaidEndDate;
    const year = now.getFullYear();
    const month = now.getMonth();

    if (isInitialSync || forceCurrentMonth) {
      // Sync CURRENT month for initial account setup
      targetMonthStart = getUtcDateBoundary(year, month, 1);
      targetMonthEnd = getUtcDateBoundary(year, month, now.getDate() + 1);

      // Fetch from start of current month to today
      plaidStartDate = formatPlaidDate(year, month, 1);
      plaidEndDate = formatPlaidDate(year, month, now.getDate());
    } else {
      // Regular syncs normally target last month, but on the 1st we need to
      // start building the current month so Jan 1 doesn't show Dec data.
      const isFirstDayOfMonth = now.getDate() === 1;

      if (isFirstDayOfMonth) {
        targetMonthStart = getUtcDateBoundary(year, month, 1);
        targetMonthEnd = getUtcDateBoundary(year, month, 2);
        plaidStartDate = formatPlaidDate(year, month, 1);
        plaidEndDate = formatPlaidDate(year, month, 1);
      } else {
        const lastMonthLastDay = new Date(year, month, 0).getDate();

        targetMonthStart = getUtcDateBoundary(year, month - 1, 1);
        targetMonthEnd = getUtcDateBoundary(year, month, 1);

        // Fetch 2 months from Plaid to catch edge cases
        plaidStartDate = formatPlaidDate(year, month - 2, 1);
        plaidEndDate = formatPlaidDate(year, month - 1, lastMonthLastDay);
      }
    }


    let syncPending = false;
    let totalSyncedTransactions = 0;

    await Promise.all(
      plaidItems.map(async (item) => {
        try {
          // Implement pagination to get ALL transactions, not just first 100
          let transactions = [];
          let hasMore = true;
          let offset = 0;
          const batchSize = 500; // Plaid's max is 500 per request

          while (hasMore) {
            const response = await plaidClient.transactionsGet({
              access_token: item.accessToken,
              start_date: plaidStartDate,
              end_date: plaidEndDate,
              options: {
                offset: offset,
                count: batchSize
              }
            });

            const pageTxns = response.data.transactions;
            const totalAvailable = response.data.total_transactions;

            transactions = transactions.concat(pageTxns);
            offset += pageTxns.length;

            // Continue if we got a full batch AND there are more transactions available
            hasMore = pageTxns.length === batchSize && offset < totalAvailable;
          }

          // Filter to only keep target month's transactions
          const filteredTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= targetMonthStart && txDate < targetMonthEnd;
          });

          // Batch upsert transactions for better performance
          await Promise.all(
            filteredTransactions.map(tx => {
              const transactionData = {
                plaidTransactionId: tx.transaction_id,
                plaidItemId: item.id,
                userId: item.userId,
                accountId: tx.account_id,
                amount: tx.amount,
                isoCurrencyCode: tx.iso_currency_code,
                unofficialCurrencyCode: tx.unofficial_currency_code,
                category: JSON.stringify(tx.personal_finance_category
                  ? [tx.personal_finance_category.primary, tx.personal_finance_category.detailed]
                  : []),
                categoryId: tx.personal_finance_category?.primary || null,
                date: new Date(tx.date),
                name: tx.name || tx.merchant_name || "Unknown",
                merchantName: tx.merchant_name,
                pending: tx.pending,
              };

              const isExcluded = shouldExcludeTransaction(transactionData);

              return prisma.transaction.upsert({
                where: { plaidTransactionId: tx.transaction_id },
                create: { ...transactionData, isExcluded },
                update: {
                  userId: item.userId,
                  amount: tx.amount,
                  pending: tx.pending,
                  isExcluded,
                },
              });
            })
          );

          totalSyncedTransactions += filteredTransactions.length;

          // Update lastSyncedAt timestamp
          await prisma.plaidItem.update({
            where: { id: item.id },
            data: { lastSyncedAt: new Date() }
          });
        } catch (error) {
          // Handle PRODUCT_NOT_READY or PRODUCTS_NOT_READY error - Plaid is still syncing
          const errorCode = error.response?.data?.error_code;
          if (errorCode === 'PRODUCT_NOT_READY' || errorCode === 'PRODUCTS_NOT_READY') {
            syncPending = true;
          } else {
            console.error(`Error syncing transactions for item ${item.id}:`, {
              errorCode: error.response?.data?.error_code,
              errorMessage: error.response?.data?.error_message,
              errorType: error.response?.data?.error_type,
            });
          }
        }
      })
    );

    res.json({
      success: true,
      syncPending: syncPending,
      transactionCount: totalSyncedTransactions,
      message: syncPending
        ? 'Transactions not ready yet, please retry in a few seconds'
        : `Successfully synced ${totalSyncedTransactions} transactions`
    });
  } catch (error) {
    console.error('Error in sync-transactions:', error);
    res.status(500).json({
      error: "Failed to sync transactions"
    });
  }
}
