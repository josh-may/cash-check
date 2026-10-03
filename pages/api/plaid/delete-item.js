import { plaidClient, prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { plaidItemId } = req.body || {};
    if (!plaidItemId) {
      return res.status(400).json({ error: "plaidItemId is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const plaidItem = await prisma.plaidItem.findFirst({
      where: { id: plaidItemId, userId: user.id },
    });

    if (!plaidItem) {
      return res.status(404).json({ error: "Plaid item not found" });
    }

    // Remove from Plaid's side
    let plaidRemoved = false;
    try {
      await plaidClient.itemRemove({ access_token: plaidItem.accessToken });
      plaidRemoved = true;
    } catch (e) {
      const msg = e.response?.data?.error_message || e.message;
      // "could not be found" means it's already gone from Plaid
      if (msg.includes("could not be found")) {
        plaidRemoved = true;
      } else {
        console.error("Plaid itemRemove failed:", msg);
      }
    }

    // Only clear accessToken if Plaid removal succeeded.
    // If it failed, keep the token so we can retry cleanup later.
    await prisma.plaidItem.update({
      where: { id: plaidItemId },
      data: plaidRemoved
        ? { status: "removed", accessToken: "" }
        : { status: "removal_failed" },
    });

    if (!plaidRemoved) {
      console.error(`ORPHAN_RISK: PlaidItem ${plaidItemId} removal failed, token preserved for retry`);
      // Still return success to the UI so user can proceed with reconnecting
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing Plaid item:", error);
    res.status(500).json({ error: "Failed to remove Plaid item" });
  }
}
