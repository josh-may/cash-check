import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { createTransactionSignature } from "../../../lib/transaction-signature";

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

    const { transactions, tag, importBatchId } = req.body;
    const trimmedTag = String(tag || "").trim();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "No transactions provided" });
    }

    if (!trimmedTag) {
      return res.status(400).json({ error: "Tag is required" });
    }
    if (trimmedTag.length > 50) {
      return res.status(400).json({ error: "Tag must be 50 characters or less" });
    }

    if (!importBatchId || typeof importBatchId !== "string") {
      return res.status(400).json({ error: "Import batch ID is required" });
    }

    // Validate each transaction
    const validationErrors = [];
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.date || Number.isNaN(new Date(tx.date).getTime())) {
        validationErrors.push(`Transaction ${i + 1}: Invalid date`);
      }
      if (!tx.name || !String(tx.name).trim()) {
        validationErrors.push(`Transaction ${i + 1}: Missing name`);
      }
      const amount = Number(tx.amount);
      if (!Number.isFinite(amount) || amount === 0) {
        validationErrors.push(`Transaction ${i + 1}: Invalid amount`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: validationErrors });
    }

    // Get existing transactions for duplicate checking
    // Look for transactions with same date, amount, and similar name within same tag
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        tag: trimmedTag,
      },
      select: {
        date: true,
        amount: true,
        name: true,
      },
    });

    // Build a set of existing transaction signatures
    const existingSignatures = new Set(
      existingTransactions
        .map((tx) => createTransactionSignature(tx))
        .filter(Boolean)
    );

    // Separate transactions into importable and duplicates
    const toImport = [];
    const duplicates = [];

    for (const tx of transactions) {
      const signature = createTransactionSignature(tx);
      if (!signature) {
        duplicates.push({
          date: tx.date,
          name: tx.name,
          amount: tx.amount,
          reason: "Invalid transaction format",
        });
        continue;
      }

      if (existingSignatures.has(signature)) {
        duplicates.push({
          date: tx.date,
          name: tx.name,
          amount: tx.amount,
          reason: "Potential duplicate (same date, amount, and name)",
        });
      } else {
        toImport.push(tx);
        // Add to existing signatures to prevent duplicates within the same import
        existingSignatures.add(signature);
      }
    }

    // Bulk insert non-duplicate transactions
    if (toImport.length > 0) {
      await prisma.transaction.createMany({
        data: toImport.map(tx => ({
          source: "csv",
          userId: user.id,
          tag: trimmedTag,
          date: new Date(tx.date),
          name: String(tx.name).trim(),
          amount: Number(tx.amount),
          pending: false,
          isExcluded: false,
          category: "[]",
          importBatchId,
        })),
      });
    }

    return res.status(200).json({
      imported: toImport.length,
      skipped: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ error: "Failed to import transactions" });
  }
}
