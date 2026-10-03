import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: "Transaction ID required" });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          { userId: user.id },
          { plaidItem: { userId: user.id } },
        ],
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { isExcluded: !transaction.isExcluded },
    });

    return res.status(200).json({ transaction: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to toggle exclusion" });
  }
}
