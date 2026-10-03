import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // Get the current user session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // Cancel the subscription at period end (user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update user in database to reflect cancellation
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Keep the subscription ID and period end date, but the webhook will handle cleanup
        // when the subscription actually ends
      },
    });

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      cancelAt: subscription.cancel_at,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
}