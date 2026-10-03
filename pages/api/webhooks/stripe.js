import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { buffer } from "micro";
import { Resend } from "resend";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);

// Disable Next.js body parser for this route to access the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

function getWelcomeEmailHtml(firstName) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to cash check</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Hi ${firstName},</p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Thanks for signing up for cash check!</p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">To get the most out of it, add a minimum amount you'd like to have in each of your bank accounts:</p>

          <div style="text-align: center; margin: 0 0 25px 0;">
          </div>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">After setting this up you'll get a monthly email at the beginning of the month showing you how much you have in each account and if you're above or below your minimum. Here's what the email looks like:</p>

          <div style="text-align: center; margin: 0 0 30px 0;">
          </div>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">That's all, thanks again for signing up, shoot me an email if you need anything!</p>

          <p style="margin: 0 0 25px 0; font-size: 16px; color: #333333;">Example</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function handleCheckoutSessionCompleted(session) {
  const userId = session?.metadata?.userId;
  const subscriptionId =
    typeof session?.subscription === "string"
      ? session.subscription
      : session?.subscription?.id || session?.metadata?.subscriptionId;

  if (!userId || !subscriptionId) {
    throw new Error(
      "Missing userId or subscriptionId in checkout session (expected metadata.userId and session.subscription)"
    );
  }

  // Idempotency: if we've already marked this user as paid for this subscription,
  // don't send duplicate welcome emails on Stripe webhook retries.
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasPaid: true, stripeSubscriptionId: true },
  });
  if (
    existingUser?.hasPaid &&
    existingUser.stripeSubscriptionId === subscriptionId
  ) {
    console.log(
      `User ${userId} already marked as paid for subscription ${subscriptionId} (skipping).`
    );
    return existingUser;
  }

  // Retrieve the full subscription object to get details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Parse and validate the subscription end date
  let stripeCurrentPeriodEnd = null;
  if (subscription.current_period_end) {
    stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    if (isNaN(stripeCurrentPeriodEnd.getTime())) {
      console.error(
        `Invalid current_period_end timestamp from Stripe: ${subscription.current_period_end}`
      );
      stripeCurrentPeriodEnd = null;
    }
  }

  // Update user with subscription details and mark as paid
  const stripePriceId = subscription.items?.data?.[0]?.price?.id;
  if (!stripePriceId) {
    throw new Error(
      `Missing price id on subscription items for subscription ${subscription.id}`
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      hasPaid: true,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      stripeCurrentPeriodEnd,
    },
  });

  // Send welcome email
  if (updatedUser) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "cash check <support@example.com>",
        to: updatedUser.email,
        subject: "Getting Started - cash check",
        html: getWelcomeEmailHtml(updatedUser.firstName),
      });
      console.log(`Welcome email sent to ${updatedUser.email}`);
    } catch (emailError) {
      console.error(`Failed to send welcome email: ${emailError.message}`);
    }
  }

  console.log(
    `Successfully updated user ${userId} with subscription ${subscription.id}`
  );
  
  return updatedUser;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Parse and verify webhook signature
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    
    if (error.message?.includes("Missing")) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    
    return res.status(500).json({ error: "Webhook handler failed." });
  }
}
