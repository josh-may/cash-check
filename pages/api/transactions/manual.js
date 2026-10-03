import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    const { tag, date, name, amount, type } = req.body;

    if (!tag || !date || !name || amount === undefined || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Type must be 'income' or 'expense'" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        source: "manual",
        userId: user.id,
        tag,
        date: new Date(date),
        name,
        amount: type === "expense" ? Math.abs(amount) : -Math.abs(amount),
        pending: false,
        isExcluded: false,
        category: "[]",
      },
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create manual transaction" });
  }
}
