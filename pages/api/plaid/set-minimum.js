import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/plaid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { accountId, minimumBalance } = req.body;
    if (!accountId) return res.status(400).json({ error: "Account ID is required" });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { plaidItem: true },
    });

    if (!account || account.plaidItem.userId !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { minimumBalance: minimumBalance ? parseFloat(minimumBalance) : null },
    });

    return res.status(200).json({ success: true, account: updated });
  } catch (error) {
    console.error("Error setting minimum:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
