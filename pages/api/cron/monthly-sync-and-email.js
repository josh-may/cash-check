import { plaidClient, prisma } from "../../../lib/plaid";
import { shouldExcludeTransaction } from "../../../lib/transaction-filters";
import { Resend } from "resend";
import { summarizeMonth, generateMonthlyEmail } from "../../../lib/monthly-email.mjs";

const resend = new Resend(process.env.RESEND_API_KEY);
const getUtcDateBoundary = (year, month, day) => new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
const formatPlaidDate = (year, month, day) => {
  const date = new Date(year, month, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getAppBankBalanceUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/+$/, "")}/app/balance`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.CRON_SECRET_KEY || req.headers["x-cron-secret"] !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // STEP 1: SYNC BALANCES
    // Trigger balance sync for all users
    console.log("Starting balance sync for all users...");
    const syncedBalanceItems = new Set();
    try {
      const balanceSyncResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/plaid/sync-balances`,
        {
          method: "POST",
          headers: {
            "x-cron-secret": process.env.CRON_SECRET_KEY,
          },
        }
      );

      if (balanceSyncResponse.ok) {
        const balanceResult = await balanceSyncResponse.json();
        for (const itemId of balanceResult.syncedItemIds || []) syncedBalanceItems.add(itemId);
        console.log("Balance sync completed:", balanceResult);
      } else {
        console.error(
          "Balance sync failed:",
          await balanceSyncResponse.text()
        );
      }
    } catch (balanceSyncError) {
      console.error("Error triggering balance sync:", balanceSyncError);
    }

    // STEP 2: SYNC TRANSACTIONS
    // Always sync LAST month's transactions (the most recently completed month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastMonthStart = getUtcDateBoundary(year, month - 1, 1);
    const thisMonthStart = getUtcDateBoundary(year, month, 1);
    const lastMonthDisplayDate = new Date(year, month - 1, 1);
    const lastMonthLastDay = new Date(year, month, 0).getDate();

    // Fetch from Plaid - last month only
    const plaidStartDate = formatPlaidDate(year, month - 1, 1);
    const plaidEndDate = formatPlaidDate(year, month - 1, lastMonthLastDay);

    // Target month is always last month
    const targetMonthStart = lastMonthStart;
    const targetMonthEnd = thisMonthStart;

    const monthName = lastMonthDisplayDate.toLocaleDateString("en-US", {
      month: "long",
    });

    const plaidItems = await prisma.plaidItem.findMany();
    console.log(
      `Found ${plaidItems.length} Plaid items to sync for ${monthName}`
    );

    let syncStats = {
      itemsProcessed: 0,
      itemsFailed: 0,
      totalTransactions: 0,
      deletedTransactions: 0,
    };

    const failedTransactionItems = new Set();

    // Sync all PlaidItems with fresh data
    await Promise.all(
      plaidItems.map(async (item) => {
        try {
          // Implement pagination to get ALL transactions
          let transactions = [];
          let hasMore = true;
          let offset = 0;
          const batchSize = 500;

          while (hasMore) {
            const response = await plaidClient.transactionsGet({
              access_token: item.accessToken,
              start_date: plaidStartDate,
              end_date: plaidEndDate,
              options: {
                offset: offset,
                count: batchSize,
              },
            });

            const pageTxns = response.data.transactions;
            const totalAvailable = response.data.total_transactions;

            transactions = transactions.concat(pageTxns);
            offset += pageTxns.length;

            hasMore = pageTxns.length === batchSize && offset < totalAvailable;
          }

          // Filter to only keep target month's transactions
          const filteredTransactions = transactions.filter((tx) => {
            const txDate = new Date(tx.date);
            return txDate >= targetMonthStart && txDate < targetMonthEnd;
          });

          syncStats.totalTransactions += filteredTransactions.length;

          // Update existing rows in place so transaction tags survive refreshes.
          const refreshedTransactions = filteredTransactions.map((tx) => {
              const transactionData = {
                plaidTransactionId: tx.transaction_id,
                plaidItemId: item.id,
                userId: item.userId,
                accountId: tx.account_id,
                amount: tx.amount,
                isoCurrencyCode: tx.iso_currency_code,
                unofficialCurrencyCode: tx.unofficial_currency_code,
                category: JSON.stringify(
                  tx.personal_finance_category
                    ? [
                        tx.personal_finance_category.primary,
                        tx.personal_finance_category.detailed,
                      ]
                    : []
                ),
                categoryId: tx.personal_finance_category?.primary || null,
                date: new Date(tx.date),
                name: tx.name || tx.merchant_name || "Unknown",
                merchantName: tx.merchant_name,
                pending: tx.pending,
              };

              return prisma.transaction.upsert({
                where: { plaidTransactionId: tx.transaction_id },
                create: { ...transactionData, isExcluded: shouldExcludeTransaction(transactionData) },
                // Tag and manual exclusions belong to the user, not the Plaid response.
                update: transactionData,
              });
          });
          // Remove transactions Plaid no longer returns and refresh atomically.
          const [deleteResult] = await prisma.$transaction([
            prisma.transaction.deleteMany({ where: {
              userId: item.userId, plaidItemId: item.id, source: "plaid",
              date: { gte: targetMonthStart, lt: targetMonthEnd },
              plaidTransactionId: { notIn: filteredTransactions.map((tx) => tx.transaction_id) },
            } }),
            ...refreshedTransactions,
          ]);
          syncStats.deletedTransactions += deleteResult.count;

          await prisma.plaidItem.update({
            where: { id: item.id },
            data: { lastSyncedAt: new Date() },
          });

          console.log(
            `Successfully synced ${filteredTransactions.length} transactions for Plaid item ${item.id}`
          );
          syncStats.itemsProcessed++;
        } catch (error) {
          const errorCode = error.response?.data?.error_code;
          console.error(
            `Failed to sync Plaid item ${item.id}: ${errorCode}`,
            error.message,
            error.response?.data || error
          );
          syncStats.itemsFailed++;
          failedTransactionItems.add(item.id);

          // Update PlaidItem status based on error
          let status = "good";
          if (errorCode === "ITEM_LOGIN_REQUIRED" || errorCode === "ITEM_NOT_FOUND") {
            status = "bad";
          } else if (errorCode === "INSTITUTION_NOT_RESPONDING" || errorCode === "INSTITUTION_DOWN") {
            status = "institution_error";
          }
          if (status !== "good") {
            await prisma.plaidItem.update({ where: { id: item.id }, data: { status } });
          }
        }
      })
    );

    // STEP 3: SEND MONTHLY REPORTS TO ALL SUBSCRIBED USERS

    const subscribedUsers = await prisma.user.findMany({
      where: { stripeSubscriptionId: { not: null } },
    });

    let emailStats = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    await Promise.all(
      subscribedUsers.map(async (user) => {
        try {
          const plaidItems = await prisma.plaidItem.findMany({
            where: { userId: user.id },
            include: {
              accounts: {
                include: {
                  balances: { orderBy: { month: "desc" }, take: 1 },
                },
              },
            },
          });

          // Check for bad items that need reconnection
          const badItems = plaidItems.filter((item) => item.status === "bad" || item.status === "institution_error");

          if (badItems.length > 0) {
            // Send reconnect email instead of balance email
            const badItem = badItems[0];
            const connectionName = badItem.institutionName ||
              (badItem.accounts[0]?.type === "credit" ? "credit card" : "bank account");

            console.log(`Sending reconnect email to ${user.email} for ${connectionName}`);

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || "cash check <support@example.com>",
              to: user.email,
              subject: "Action Required: Reconnect Your Account - cash check",
              html: generateReconnectEmailHtml(user.firstName, connectionName, badItems.length),
            });

            emailStats.sent++;
            return;
          }

          // Do not present incomplete transaction data or stale balances as current.
          if (plaidItems.some((item) => !syncedBalanceItems.has(item.id) || failedTransactionItems.has(item.id))) {
            console.log(`Incomplete monthly sync for ${user.email}, skipping report`);
            emailStats.skipped++;
            return;
          }

          const transactions = await prisma.transaction.findMany({
            where: {
              userId: user.id,
              date: { gte: targetMonthStart, lt: targetMonthEnd },
              pending: false,
              isExcluded: false,
            },
          });
          const report = summarizeMonth(user, plaidItems.flatMap((item) => item.accounts), transactions);
          const email = generateMonthlyEmail({
            firstName: user.firstName,
            month: monthName,
            balanceDate: now.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
            report,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          });

          console.log(`Sending monthly report to ${user.email}`);
          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "cash check <support@example.com>",
            to: user.email,
            ...email,
          });
          if (result.error) throw new Error(result.error.message);

          emailStats.sent++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error.message);
          emailStats.failed++;
        }
      })
    );

    // Return comprehensive stats
    return res.json({
      success: true,
      month: monthName,
      sync: {
        deletedExisting: syncStats.deletedTransactions,
        itemsProcessed: syncStats.itemsProcessed,
        itemsFailed: syncStats.itemsFailed,
        totalTransactions: syncStats.totalTransactions,
      },
      emails: {
        sent: emailStats.sent,
        failed: emailStats.failed,
        skipped: emailStats.skipped,
        total: subscribedUsers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Monthly sync and email failed",
      message: error.message,
    });
  }
}

function generateReconnectEmailHtml(userName, connectionName, badItemCount) {
  const plural = badItemCount > 1;
  const connectionText = plural ? `${badItemCount} connections` : `your ${connectionName} connection`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reconnect Your Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Hi ${userName || "there"},</p>

          <p style="margin: 0 0 15px 0; font-size: 16px; color: #333333;">
            We couldn't sync ${connectionText} this month. This usually happens when your bank requires you to re-authenticate.
          </p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
            To keep receiving your monthly balance reports, please reconnect your account:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${getAppBankBalanceUrl()}"
               style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reconnect Account
            </a>
          </div>

          <p style="margin: 25px 0 0 0; font-size: 16px; color: #333333;">-cashflow memo bot</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
