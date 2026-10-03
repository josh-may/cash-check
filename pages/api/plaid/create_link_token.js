import { plaidClient, prisma } from "../../../lib/plaid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { plaidItemId } = req.body || {};
    let accessToken;

    if (plaidItemId) {
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

      accessToken = plaidItem.accessToken;
      // Note: We previously called itemGet() here to check status, but removed it
      // to reduce unnecessary Plaid API calls. Item status is tracked in our DB.
    }

    const linkTokenConfig = {
      user: { client_user_id: session.user.id },
      client_name: "cash check",
      country_codes: ["US"],
      language: "en",
      // For update mode (reconnection), use access_token; for new connections, use products
      ...(accessToken
        ? { access_token: accessToken }
        : { products: ["transactions"] }),
    };

    const tokenResponse = await plaidClient.linkTokenCreate(linkTokenConfig);

    res.json(tokenResponse.data);
  } catch (error) {
    console.error("Error creating link token:", error.response?.data || error);
    res.status(500).json({
      error: "Failed to create link token",
      details: error.response?.data || error.message,
    });
  }
}
