import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const userId = session?.metadata?.userId;
    const subscriptionId =
      typeof session?.subscription === "string"
        ? session.subscription
        : session?.subscription?.id;

    if (!userId || !subscriptionId) {
      return res.status(400).json({
        error:
          "Unable to confirm checkout (missing metadata.userId or subscription id)",
      });
    }

    const subscription =
      typeof session?.subscription === "object" && session.subscription
        ? session.subscription
        : await stripe.subscriptions.retrieve(subscriptionId);

    // For subscription-mode checkouts, treat active/trialing as "paid access".
    if (!["active", "trialing"].includes(subscription.status)) {
      return res.status(409).json({
        error: `Subscription not active (status=${subscription.status})`,
      });
    }

    const stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null;
    const stripeCurrentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        hasPaid: true,
        stripeSubscriptionId: subscription.id,
        stripePriceId,
        stripeCurrentPeriodEnd,
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("confirm-checkout error:", error);
    return res.status(500).json({ error: "Failed to confirm checkout" });
  }
}

