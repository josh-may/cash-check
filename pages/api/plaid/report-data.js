import { resolveTransactionTag } from "../../../lib/transaction-tags.mjs";
import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        plaidItems: {
          include: {
            accounts: {
              where: { isExcluded: false, closedAt: null }
            },
            transactions: {
              orderBy: { date: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const badPlaidItemIds = user.plaidItems
      .filter((item) => item.status === "bad")
      .map((item) => item.id);

    const hasInstitutionError = user.plaidItems.some(
      (item) => item.status === "institution_error"
    );

    // Get details about bad items for frontend messaging
    const badItems = user.plaidItems
      .filter((item) => item.status === "bad" || item.status === "institution_error")
      .map((item) => ({
        id: item.id,
        status: item.status,
        institutionName: item.institutionName,
        accountType: item.accounts[0]?.type || null,
      }));

    // Flatten all transactions with account metadata
    const accountsData = user.plaidItems.flatMap(plaidItem => {
      // If there are accounts, map transactions through them
      if (plaidItem.accounts.length > 0) {
        return plaidItem.accounts.map(account => {
          const accountTransactions = plaidItem.transactions.filter(
            tx => tx.accountId === account.plaidAccountId
          );
          return {
            accountName: account.name,
            accountType: account.type,
            accountTag: account.tag || "Main",
            transactions: accountTransactions
          };
        });
      }

      // Fallback: If no accounts exist, group all transactions under institution name
      // This handles orphaned transactions from dead PlaidItems
      if (plaidItem.transactions.length > 0) {
        return [{
          accountName: plaidItem.institutionName || "Unknown Account",
          accountType: "depository",
          accountTag: "Main",
          transactions: plaidItem.transactions
        }];
      }

      return [];
    });

    // Include orphaned Plaid transactions linked to this user but not to current PlaidItems.
    // This can happen after relinks/migrations where old PlaidItem rows are removed.
    const plaidItemIds = user.plaidItems.map((item) => item.id);
    const orphanPlaidTransactions = await prisma.transaction.findMany({
      where: {
        source: "plaid",
        userId: user.id,
        ...(plaidItemIds.length > 0
          ? {
              OR: [
                { plaidItemId: null },
                { plaidItemId: { notIn: plaidItemIds } },
              ],
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    const orphanAccountIds = [
      ...new Set(orphanPlaidTransactions.map((tx) => tx.accountId).filter(Boolean)),
    ];

    // Only consult Account rows that still belong to the current user. Stale
    // rows (left over from re-links / deleted PlaidItems) keep their old tags
    // forever and would otherwise resurrect ghost cashflow groups.
    const orphanAccounts = orphanAccountIds.length
      ? await prisma.account.findMany({
          where: {
            plaidAccountId: { in: orphanAccountIds },
            plaidItem: { is: { userId: user.id } },
          },
          select: { plaidAccountId: true, name: true, type: true, tag: true },
        })
      : [];

    const orphanAccountMap = new Map(
      orphanAccounts.map((account) => [account.plaidAccountId, account])
    );

    // When an orphan tx can't be matched to a live account, fall back to the
    // user's most common live-account tag (or "Main" if they have none yet),
    // so orphan history still appears alongside the user's current cashflow
    // groups instead of creating phantom ones from stale metadata.
    const liveTagCounts = new Map();
    user.plaidItems.forEach((item) =>
      item.accounts.forEach((account) => {
        const t = account.tag || "Main";
        liveTagCounts.set(t, (liveTagCounts.get(t) || 0) + 1);
      })
    );
    let fallbackTag = "Main";
    let bestCount = 0;
    liveTagCounts.forEach((count, tag) => {
      if (count > bestCount) {
        bestCount = count;
        fallbackTag = tag;
      }
    });

    const orphanAccountsDataMap = new Map();
    orphanPlaidTransactions.forEach((tx) => {
      const accountMeta = tx.accountId ? orphanAccountMap.get(tx.accountId) : null;
      const key = tx.accountId || `orphan-${tx.plaidItemId || "unknown"}`;

      if (!orphanAccountsDataMap.has(key)) {
        orphanAccountsDataMap.set(key, {
          accountName: accountMeta?.name || "Unlinked Account",
          accountType: accountMeta?.type || "depository",
          accountTag: tx.tag || accountMeta?.tag || fallbackTag,
          transactions: [],
        });
      }

      orphanAccountsDataMap.get(key).transactions.push(tx);
    });

    const allAccountsData = [
      ...accountsData,
      ...Array.from(orphanAccountsDataMap.values()),
    ];

    // Fetch all non-Plaid, tag-based transactions for this user (manual + CSV imports).
    const taggedTransactions = await prisma.transaction.findMany({
      where: {
        source: { in: ["manual", "csv"] },
        userId: user.id,
        tag: { not: null }
      },
      orderBy: { date: 'desc' }
    });

    // Get year from query param, default to current year
    const selectedYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    // Collect all unique years from transactions (use UTC to avoid timezone edge cases)
    const allYears = new Set();
    allAccountsData.forEach(account => {
      account.transactions.forEach(tx => {
        allYears.add(new Date(tx.date).getUTCFullYear());
      });
    });
    taggedTransactions.forEach(tx => {
      allYears.add(new Date(tx.date).getUTCFullYear());
    });

    // Always include current year as an option
    allYears.add(new Date().getFullYear());

    // Convert to sorted array (descending - most recent first)
    const availableYears = Array.from(allYears).sort((a, b) => b - a);

    // Create monthly aggregations
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Group accounts by their tags
    const tagGroups = {};

    // Helper function to initialize tag group
    const initializeTagGroup = (tag) => {
      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          name: tag,
          monthlyData: {}
        };

        // Initialize all months with zero values for this tag
        months.forEach((month) => {
          tagGroups[tag].monthlyData[month] = {
            income: 0,
            expenses: 0,
            transactions: []
          };
        });
      }
    };

    // Helper to add transaction to tag group
    const addTransaction = (tag, tx, accountName, source) => {
      tag = resolveTransactionTag(tx, tag);
      initializeTagGroup(tag);

      const txDate = new Date(tx.date);
      if (txDate.getUTCFullYear() !== selectedYear) return;

      const monthName = months[txDate.getUTCMonth()];

      if (!tx.isExcluded) {
        const amount = Math.abs(tx.amount);
        tagGroups[tag].monthlyData[monthName][tx.amount > 0 ? 'expenses' : 'income'] += amount;
      }

      tagGroups[tag].monthlyData[monthName].transactions.push({
        id: tx.id,
        date: tx.date,
        name: tx.name,
        merchantName: tx.merchantName,
        amount: tx.amount,
        category: tx.category,
        pending: tx.pending,
        accountName,
        isExcluded: tx.isExcluded || false,
        source,
        tag: tx.tag || null,
        effectiveTag: tag
      });
    };

    // Process all transactions
    allAccountsData.forEach(account =>
      account.transactions.forEach(tx =>
        addTransaction(account.accountTag, tx, account.accountName, tx.source || "plaid")
      )
    );

    taggedTransactions.forEach((tx) =>
      addTransaction(
        tx.tag,
        tx,
        tx.source === "csv" ? "CSV Import" : "Manual Entry",
        tx.source || "manual"
      )
    );

    const sortTagGroups = (a, b) => {
      const aIsMain = a.name.toLowerCase() === "main";
      const bIsMain = b.name.toLowerCase() === "main";
      if (aIsMain && !bIsMain) return -1;
      if (bIsMain && !aIsMain) return 1;
      return a.name.localeCompare(b.name, "en-US", { sensitivity: "base" });
    };

    // Format the response with all tag groups
    const reportData = {
      year: selectedYear,
      availableYears: availableYears,
      months: months,
      badPlaidItemIds,
      hasInstitutionError,
      badItems,
      accounts: Object.values(tagGroups).sort(sortTagGroups).map(group => ({
        name: group.name,
        monthlyData: months.map(month => ({
          month,
          income: group.monthlyData[month].income.toFixed(2),
          expenses: group.monthlyData[month].expenses.toFixed(2),
          net: (group.monthlyData[month].income - group.monthlyData[month].expenses).toFixed(2),
          transactionCount: group.monthlyData[month].transactions.length,
          transactions: group.monthlyData[month].transactions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          )
        }))
      })),
      summary: {
        totalAccounts: allAccountsData.length,
        lastUpdated: user.plaidItems[0]?.lastSyncedAt || new Date()
      }
    };

    res.json(reportData);
  } catch (error) {
    console.error('ERROR in report-data:', error);
    res.status(500).json({
      error: "Failed to fetch report data",
      details: error.message
    });
  }
}
