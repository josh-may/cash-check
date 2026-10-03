import { prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { accountId, month, year, amount } = req.body;

    if (!accountId || !month || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        plaidItem: {
          user: {
            email: session.user.email
          }
        }
      }
    });

    if (!account) {
      return res.status(403).json({ error: "Account not found or access denied" });
    }

    // Construct the date for the first day of the month in UTC
    // This must match how we store/retrieve dates in balance-data.js
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) {
      return res.status(400).json({ error: "Invalid month" });
    }

    // Create date as UTC
    const date = new Date(Date.UTC(year, monthIndex, 1));

    if (amount === null || amount === "") {
        await prisma.balance.deleteMany({
            where: {
                accountId,
                month: date,
            }
        });
        return res.json({ message: "Balance deleted" });
    }
    
    const balanceValue = parseFloat(amount);
    if (isNaN(balanceValue)) {
       return res.status(400).json({ error: "Invalid amount" });
    }

    const balance = await prisma.balance.upsert({
      where: {
        accountId_month: {
          accountId,
          month: date,
        },
      },
      update: {
        balance: balanceValue,
      },
      create: {
        accountId,
        month: date,
        balance: balanceValue,
      },
    });

    return res.json(balance);
  } catch (error) {
    console.error("Error updating balance:", error);
    return res.status(500).json({ error: "Failed to update balance" });
  }
}
