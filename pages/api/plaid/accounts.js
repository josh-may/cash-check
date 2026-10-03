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
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Handle PUT request to update account metadata
    if (req.method === 'PUT') {
      const { accountId, tag, name } = req.body;

      if (!accountId || (tag === undefined && name === undefined)) {
        return res.status(400).json({ error: "Missing accountId or update field" });
      }

      const existing = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          plaidItem: { select: { userId: true } },
        },
      });

      if (!existing || existing.plaidItem?.userId !== user.id) {
        return res.status(404).json({ error: "Account not found" });
      }

      const oldTag = existing.tag || "Main";
      const newTag = tag === undefined ? oldTag : tag;
      const trimmedName = typeof name === "string" ? name.trim() : undefined;
      const data = {};

      if (tag !== undefined) data.tag = newTag;
      if (trimmedName !== undefined) {
        if (!trimmedName) {
          return res.status(400).json({ error: "Account name is required" });
        }
        data.name = trimmedName.slice(0, 100);
      }

      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data,
      });

      // If renaming the tag empties out the old group entirely (no other
      // accounts left with that tag), also move CSV / manual transactions
      // tagged with the old name so the abandoned group disappears instead
      // of lingering with orphaned imports. Plaid transactions are grouped
      // via their account's tag, so they don't need touching.
      if (tag !== undefined && oldTag !== newTag) {
        const stillUsingOld = await prisma.account.count({
          where: {
            tag: oldTag,
            plaidItem: { userId: user.id },
          },
        });

        if (stillUsingOld === 0) {
          await prisma.transaction.updateMany({
            where: {
              userId: user.id,
              tag: oldTag,
              source: { in: ["csv", "manual"] },
            },
            data: { tag: newTag },
          });
        }
      }

      return res.json(updatedAccount);
    }

    // Handle PATCH request to toggle account isExcluded status
    if (req.method === 'PATCH') {
      const { accountId } = req.body;

      if (!accountId) {
        return res.status(400).json({ error: "Missing accountId" });
      }

      // Get current account
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          plaidItem: { select: { userId: true } },
        },
      });

      if (!account || account.plaidItem?.userId !== user.id) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Toggle isExcluded
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { isExcluded: !account.isExcluded }
      });

      return res.json(updatedAccount);
    }

    // Fetch PlaidItems with accounts
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten all accounts from all PlaidItems
    const allAccounts = plaidItems.flatMap(item =>
      item.accounts.map(account => ({
        id: account.id,
        plaidItemId: item.id,
        name: account.name,
        officialName: account.officialName,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
        currentBalance: account.currentBalance,
        availableBalance: account.availableBalance,
        currency: account.isoCurrencyCode || 'USD',
        active: true,
        tag: account.tag || 'Main',
        isExcluded: account.isExcluded,
        closedAt: account.closedAt,
        minimumBalance: account.minimumBalance,
        connectedAt: item.createdAt,
        lastSyncedAt: item.lastSyncedAt
      }))
    );

    res.json(allAccounts);
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch accounts"
    });
  }
}
