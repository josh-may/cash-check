import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatAccountName = (account) => account.name;

const isBankAccount = (account) => {
  const bankSubtypes = ['checking', 'savings', 'money market', 'cash management', 'hsa'];
  return bankSubtypes.includes(account.subtype?.toLowerCase());
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Get year from query param, default to current year
    const selectedYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          where: { isExcluded: false, closedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            balances: { orderBy: { month: "asc" } },
          },
        },
      },
    });

    // Collect all unique years from balance data (use UTC to match how dates are stored)
    const allYears = new Set();
    plaidItems.forEach((item) => {
      item.accounts.forEach((account) => {
        if (isBankAccount(account)) {
          account.balances.forEach((balance) => {
            allYears.add(new Date(balance.month).getUTCFullYear());
          });
        }
      });
    });

    // Always include current year as an option
    allYears.add(new Date().getFullYear());

    // Convert to sorted array (descending - most recent first)
    const availableYears = Array.from(allYears).sort((a, b) => b - a);

    const accounts = plaidItems
      .flatMap((item) =>
        item.accounts
          .filter((account) => isBankAccount(account))
          .map((account) => ({
            id: account.id,
            name: formatAccountName(account),
            type: account.type,
            subtype: account.subtype,
            minimumBalance: account.minimumBalance,
            monthlyData: account.balances
              .filter((balance) => new Date(balance.month).getUTCFullYear() === selectedYear)
              .map((balance) => ({
                month: months[new Date(balance.month).getUTCMonth()],
                balance: balance.balance.toFixed(2),
              })),
          }))
      );

    const badPlaidItemIds = plaidItems
      .filter((item) => item.status === "bad")
      .map((item) => item.id);

    const hasInstitutionError = plaidItems.some(
      (item) => item.status === "institution_error"
    );

    // Get details about bad items for frontend messaging.
    // `removed` is excluded — those items have no accessToken, so update-mode
    // link_token creation fails silently and the CTA is dead.
    const badItems = plaidItems
      .filter((item) => ["bad", "institution_error", "removal_failed"].includes(item.status))
      .map((item) => ({
        id: item.id,
        status: item.status,
        institutionName: item.institutionName,
        accountType: item.accounts[0]?.type || null,
      }));

    return res.json({
      months,
      accounts,
      availableYears,
      selectedYear,
      badPlaidItemIds,
      hasInstitutionError,
      badItems,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch balance data" });
  }
}
