import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const getUtcDateBoundary = (year, month, day) => new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Support filtering by specific plaidItemId
    const { plaidItemId } = req.query;

    // Get user's Plaid items
    const plaidItems = await prisma.plaidItem.findMany({
      where: plaidItemId
        ? { id: plaidItemId, userId: user.id }
        : { userId: user.id },
    });

    if (plaidItems.length === 0) {
      return res.json({
        transactions: [],
        transactionCount: 0
      });
    }

    // Define date range for last month (or current month on the 1st)
    const now = new Date();
    const isFirstDayOfMonth = now.getDate() === 1;
    const year = now.getFullYear();
    const month = now.getMonth();
    const targetMonthStart = isFirstDayOfMonth
      ? getUtcDateBoundary(year, month, 1)
      : getUtcDateBoundary(year, month - 1, 1);
    const targetMonthEnd = isFirstDayOfMonth
      ? getUtcDateBoundary(year, month, 2)
      : getUtcDateBoundary(year, month, 1);

    // Fetch transactions from DATABASE only (no Plaid API calls)
    const plaidItemIds = plaidItems.map(item => item.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        plaidItemId: {
          in: plaidItemIds
        },
        date: {
          gte: targetMonthStart,
          lt: targetMonthEnd
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Transform to match expected format
    const formattedTransactions = transactions.map(tx => ({
      transaction_id: tx.plaidTransactionId,
      account_id: tx.accountId,
      amount: tx.amount,
      iso_currency_code: tx.isoCurrencyCode,
      unofficial_currency_code: tx.unofficialCurrencyCode,
      category: tx.category,
      date: tx.date.toISOString().split('T')[0],
      name: tx.name,
      merchant_name: tx.merchantName,
      pending: tx.pending,
      personal_finance_category: tx.categoryId ? {
        primary: tx.categoryId
      } : null
    }));

    res.json({
      transactions: formattedTransactions,
      transactionCount: formattedTransactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions from database:', error);
    res.status(500).json({
      error: "Failed to fetch transactions"
    });
  }
}
