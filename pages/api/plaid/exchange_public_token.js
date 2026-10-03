import { plaidClient, prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Helper to clean up orphaned Plaid items
async function removeOrphanedPlaidItem(accessToken, itemId) {
  try {
    await plaidClient.itemRemove({ access_token: accessToken });
  } catch (removeError) {
    console.error("Failed to remove orphaned item from Plaid:", removeError.message);
    // Log this for manual cleanup later if needed
    console.error("ORPHANED_ITEM_ALERT: item_id=" + itemId);
  }
}

export default async function handler(req, res) {
  let accessToken = null;
  let itemId = null;
  let itemSavedToDb = false;

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { public_token, plaidItemId } = req.body;
    if (!public_token) {
      return res.status(400).json({ error: "Missing public_token" });
    }

    // Exchange public token for access token
    // IMPORTANT: This creates an Item on Plaid's side that we MUST save to our DB
    // or clean up if something fails
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    accessToken = exchangeResponse.data.access_token;
    itemId = exchangeResponse.data.item_id;

    // Fetch institution name for better error messaging later
    let institutionName = null;
    try {
      const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
      const institutionId = itemResponse.data.item.institution_id;
      if (institutionId) {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US"],
        });
        institutionName = instResponse.data.institution.name;
      }
    } catch (instError) {
      console.error("Failed to fetch institution name:", instError.message);
    }

    // Find user by email (more reliable than session ID)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // Clean up the Plaid item since we can't save it
      await removeOrphanedPlaidItem(accessToken, itemId);
      return res.status(400).json({ error: "User not found" });
    }

    const isReconnect = Boolean(plaidItemId);

    // Block duplicate institutions on NEW connections. Without this, picking
    // the same bank twice silently creates a second PlaidItem with fresh
    // account_ids — the source of the "duplicate Capital One" orphan pattern.
    if (!isReconnect && institutionName) {
      const existing = await prisma.plaidItem.findFirst({
        where: {
          userId: user.id,
          institutionName,
          status: { notIn: ["removed"] },
        },
      });
      if (existing) {
        await removeOrphanedPlaidItem(accessToken, itemId);
        return res.status(409).json({
          error: "duplicate_institution",
          message: `You already have ${institutionName} connected. Use the Reconnect button on the Balance page if the existing connection isn't working — adding a duplicate would split your data across two connections.`,
          existingItemId: existing.id,
          institutionName,
        });
      }
    }

    let plaidItem;
    if (isReconnect) {
      const existingItem = await prisma.plaidItem.findFirst({
        where: { id: plaidItemId, userId: user.id },
      });

      if (!existingItem) {
        // Clean up the Plaid item since we can't associate it
        await removeOrphanedPlaidItem(accessToken, itemId);
        return res.status(404).json({ error: "Plaid item not found" });
      }

      plaidItem = await prisma.plaidItem.update({
        where: { id: existingItem.id },
        data: {
          accessToken: accessToken,
          itemId: itemId,
          institutionName: institutionName || existingItem.institutionName,
          status: "good",
        },
      });

      itemSavedToDb = true;
    } else {
      // Create PlaidItem record
      plaidItem = await prisma.plaidItem.create({
        data: {
          userId: user.id,
          accessToken: accessToken,
          itemId: itemId,
          institutionName: institutionName,
        },
      });

      itemSavedToDb = true;
    }

    // Fetch and store account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;

    // Store all accounts in database. For reconnects, Plaid may rotate
    // account_id (especially during OAuth migrations). Match existing rows by
    // (plaidItemId, mask, subtype) and rewrite Transaction.accountId so
    // historical transactions stay attached to the same Account row.
    const plaidManagedFields = (account) => ({
      plaidItemId: plaidItem.id,
      officialName: account.official_name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      currentBalance: account.balances.current,
      availableBalance: account.balances.available,
      isoCurrencyCode: account.balances.iso_currency_code,
    });

    const livePlaidAccountIds = accounts.map((a) => a.account_id);

    const createdAccounts = await Promise.all(
      accounts.map(async (account) => {
        const dataFromPlaid = {
          ...plaidManagedFields(account),
          plaidAccountId: account.account_id,
          name: account.name,
        };

        if (!isReconnect) {
          return prisma.account.create({ data: dataFromPlaid });
        }

        const exact = await prisma.account.findUnique({
          where: { plaidAccountId: account.account_id },
        });
        if (exact) {
          return prisma.account.update({
            where: { id: exact.id },
            data: plaidManagedFields(account),
          });
        }

        if (account.mask) {
          const candidates = await prisma.account.findMany({
            where: {
              plaidItemId: plaidItem.id,
              mask: account.mask,
              subtype: account.subtype,
            },
          });
          if (candidates.length === 1) {
            const old = candidates[0];
            const [, updated] = await prisma.$transaction([
              prisma.transaction.updateMany({
                where: { userId: user.id, accountId: old.plaidAccountId },
                data: { accountId: account.account_id },
              }),
              prisma.account.update({
                where: { id: old.id },
                data: { ...plaidManagedFields(account), plaidAccountId: account.account_id },
              }),
            ]);
            return updated;
          }
        }

        return prisma.account.create({ data: dataFromPlaid });
      })
    );

    if (isReconnect) {
      // Reconcile: rows Plaid no longer returns are closed; live ones re-opened.
      await prisma.$transaction([
        prisma.account.updateMany({
          where: {
            plaidItemId: plaidItem.id,
            plaidAccountId: { notIn: livePlaidAccountIds },
            closedAt: null,
          },
          data: { closedAt: new Date() },
        }),
        prisma.account.updateMany({
          where: {
            plaidItemId: plaidItem.id,
            plaidAccountId: { in: livePlaidAccountIds },
            closedAt: { not: null },
          },
          data: { closedAt: null },
        }),
      ]);
    }

    // Create/update balance snapshots for depository accounts only
    // Use UTC to avoid timezone issues when storing in database
    const now = new Date();
    const currentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    );

    const dbAccountsByPlaidId = new Map(
      createdAccounts.map((a) => [a.plaidAccountId, a])
    );

    try {
      await Promise.all(
        accounts
          .filter((a) => a.type === "depository")
          .map(async (plaidAccount) => {
            const dbAccount = dbAccountsByPlaidId.get(plaidAccount.account_id);
            if (!dbAccount) return null;

            await prisma.balance.upsert({
              where: {
                accountId_month: {
                  accountId: dbAccount.id,
                  month: currentMonth,
                },
              },
              create: {
                accountId: dbAccount.id,
                month: currentMonth,
                balance: plaidAccount.balances.current || 0,
              },
              update: {
                balance: plaidAccount.balances.current || 0,
              },
            });

            return dbAccount.id;
          })
      );
    } catch (balanceError) {
      console.error("Error creating balance snapshots:", balanceError.message);
    }

    // Retry transaction sync up to 2 times
    const syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/plaid/sync-transactions?plaidItemId=${plaidItem.id}`;
    let transactionsSynced = false;

    for (let attempt = 0; attempt < 2 && !transactionsSynced; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        const syncResponse = await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie || '' },
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          if (!syncResult.syncPending) {
            transactionsSynced = true;
          }
        } else break;
      } catch (syncError) {
        console.error('Transaction sync error:', syncError.message);
        break;
      }
    }

    res.json({
      success: true,
      plaidItemId: plaidItem.id,
    });
  } catch (error) {
    console.error("Error exchanging public token:", error.response?.data || error);

    // Clean up orphaned Plaid item if we created one but didn't save it to DB
    if (accessToken && !itemSavedToDb) {
      await removeOrphanedPlaidItem(accessToken, itemId);
    }

    res.status(500).json({
      error: "Failed to exchange token",
    });
  }
}
