import { plaidClient, prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const getFirstDayOfMonth = () => {
  const now = new Date();
  // Use UTC to avoid timezone issues when storing in database
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
};

const isDepository = (accountType) => accountType === 'depository';
const mapPlaidErrorToStatus = (errorCode) => {
  if (errorCode === "ITEM_LOGIN_REQUIRED" || errorCode === "ITEM_NOT_FOUND") {
    return "bad";
  }
  if (errorCode === "INSTITUTION_NOT_RESPONDING" || errorCode === "INSTITUTION_DOWN") {
    return "institution_error";
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const isCronJob = Boolean(process.env.CRON_SECRET_KEY) && req.headers["x-cron-secret"] === process.env.CRON_SECRET_KEY;

    if (!session && !isCronJob) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let plaidItems = [];
    if (isCronJob) {
      plaidItems = await prisma.plaidItem.findMany();
    } else {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      plaidItems = await prisma.plaidItem.findMany({
        where: { userId: user.id },
      });
    }

    if (!plaidItems.length) {
      return res.json({ success: true, balancesSynced: 0 });
    }

    const currentMonth = getFirstDayOfMonth();
    let stats = { synced: 0, processed: 0, failed: 0 };
    const syncedItemIds = [];

    await Promise.all(
      plaidItems.map(async (item) => {
        try {
          const { data } = await plaidClient.accountsGet({ access_token: item.accessToken });
          const livePlaidAccountIds = new Set();

          for (const account of data.accounts) {
            livePlaidAccountIds.add(account.account_id);
            let dbAccount = await prisma.account.findUnique({
              where: { plaidAccountId: account.account_id },
            });

            // Self-heal Plaid account_id drift: if no exact match, look for the
            // same physical account on this item by (mask, subtype). Rewrite
            // both the Account row and historical Transaction.accountId so
            // nothing orphans. Only heal when the match is unambiguous.
            if (!dbAccount && account.mask) {
              const candidates = await prisma.account.findMany({
                where: {
                  plaidItemId: item.id,
                  mask: account.mask,
                  subtype: account.subtype,
                },
              });
              if (candidates.length === 1) {
                const old = candidates[0];
                const [, updated] = await prisma.$transaction([
                  prisma.transaction.updateMany({
                    where: { userId: item.userId, accountId: old.plaidAccountId },
                    data: { accountId: account.account_id },
                  }),
                  prisma.account.update({
                    where: { id: old.id },
                    data: { plaidAccountId: account.account_id },
                  }),
                ]);
                dbAccount = updated;
              }
            }

            if (dbAccount && isDepository(account.type)) {
              const syncedBalance = account.balances.current || 0;

              await prisma.balance.upsert({
                where: { accountId_month: { accountId: dbAccount.id, month: currentMonth } },
                create: { accountId: dbAccount.id, month: currentMonth, balance: syncedBalance },
                update: { balance: syncedBalance },
              });

              await prisma.account.update({
                where: { id: dbAccount.id },
                data: { currentBalance: syncedBalance, closedAt: null },
              });
              stats.synced++;
            } else if (dbAccount) {
              // Non-depository account is live at Plaid — keep it open.
              if (dbAccount.closedAt) {
                await prisma.account.update({
                  where: { id: dbAccount.id },
                  data: { closedAt: null },
                });
              }
            }
          }

          // Reconcile: any Account on this item Plaid no longer returns is closed.
          await prisma.account.updateMany({
            where: {
              plaidItemId: item.id,
              plaidAccountId: { notIn: Array.from(livePlaidAccountIds) },
              closedAt: null,
            },
            data: { closedAt: new Date() },
          });

          await prisma.plaidItem.update({ where: { id: item.id }, data: { status: "good" } });
          stats.processed++;
          syncedItemIds.push(item.id);
        } catch (error) {
          stats.failed++;
          const errorCode = error.response?.data?.error_code;
          const status = mapPlaidErrorToStatus(errorCode);
          console.error(`Plaid sync error for item ${item.id}: ${errorCode}`);
          if (status) {
            await prisma.plaidItem.update({ where: { id: item.id }, data: { status } });
          }
        }
      })
    );

    return res.json({ success: true, ...stats, syncedItemIds, month: currentMonth.toISOString() });
  } catch (error) {
    return res.status(500).json({ error: "Failed to sync balances" });
  }
}
