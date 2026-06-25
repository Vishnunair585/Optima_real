import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  billingEvents,
  emailNotifications,
  paymentHistory,
  subscriptions,
  teamMembers,
  teamWorkspaces,
  users,
} from "../lib/db/schema";
import { generateId } from "../server/auth/crypto.server";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: any };
};

function verifyStripeSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function fromStripeTimestamp(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000) : new Date();
}

function planFromMetadata(object: any) {
  const plan = object.metadata?.plan_name || object.plan?.metadata?.plan_name;
  return plan === "Team" ? "Team" : plan === "Pro" ? "Pro" : "Pro";
}

function cycleFromMetadata(object: any) {
  const cycle = object.metadata?.billing_cycle || object.plan?.metadata?.billing_cycle;
  return cycle === "yearly" ? "yearly" : "monthly";
}

async function findUserId(object: any) {
  if (object.client_reference_id) return object.client_reference_id;
  if (object.metadata?.user_id) return object.metadata.user_id;

  const subscriptionId = object.subscription || object.id;
  if (subscriptionId) {
    const sub = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripe_subscription_id, subscriptionId))
      .limit(1);
    if (sub[0]) return sub[0].user_id;
  }

  if (object.customer) {
    const sub = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripe_customer_id, object.customer))
      .limit(1);
    if (sub[0]) return sub[0].user_id;
  }
  return null;
}

async function queueEmail(userId: string | null, type: string, subject: string, body: string) {
  if (!userId) return;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return;
  await db.insert(emailNotifications).values({
    id: generateId(),
    user_id: userId,
    email: user[0].email,
    type,
    subject,
    body,
  });
}

async function recordEvent(event: StripeEvent, userId: string | null) {
  await db.insert(billingEvents).values({
    id: generateId(),
    user_id: userId,
    event_name: event.type.replace(/\./g, "_"),
    stripe_event_id: event.id,
    metadata: JSON.stringify(event.data.object),
  }).onConflictDoNothing();
}

async function upsertSubscription(userId: string, object: any, statusOverride?: string) {
  const planName = planFromMetadata(object);
  const billingCycle = cycleFromMetadata(object);
  const customerId = String(object.customer || "");
  const subscriptionId = String(object.subscription || object.id || "");
  const status = statusOverride || object.status || "active";
  const periodStart = fromStripeTimestamp(object.current_period_start);
  const periodEnd = fromStripeTimestamp(object.current_period_end);

  const existing = await db.select().from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1);

  const values = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_name: planName,
    status,
    billing_cycle: billingCycle,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date(),
  };

  if (existing[0]) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: generateId(),
      user_id: userId,
      ...values,
    });
  }

  if (planName === "Team") {
    const workspace = await db.select().from(teamWorkspaces).where(eq(teamWorkspaces.owner_user_id, userId)).limit(1);
    if (!workspace[0]) {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const workspaceId = generateId();
      await db.insert(teamWorkspaces).values({
        id: workspaceId,
        owner_user_id: userId,
        name: "AIRank Team Workspace",
        seats_purchased: object.quantity || 1,
      });
      await db.insert(teamMembers).values({
        id: generateId(),
        workspace_id: workspaceId,
        user_id: userId,
        email: user[0]?.email || "owner@airank.local",
        role: "owner",
        status: "active",
        joined_at: new Date(),
      });
    }
  }
}

async function recordInvoice(object: any, status: "paid" | "failed") {
  const userId = await findUserId(object);
  await db.insert(paymentHistory).values({
    id: generateId(),
    user_id: userId,
    stripe_invoice_id: object.id,
    stripe_payment_intent_id: object.payment_intent || null,
    stripe_subscription_id: object.subscription || null,
    amount_paid: object.amount_paid || object.amount_due || 0,
    currency: object.currency || "usd",
    status,
    hosted_invoice_url: object.hosted_invoice_url || null,
    invoice_pdf: object.invoice_pdf || null,
    paid_at: status === "paid" ? fromStripeTimestamp(object.status_transitions?.paid_at) : null,
  }).onConflictDoUpdate({
    target: paymentHistory.stripe_invoice_id,
    set: {
      status,
      amount_paid: object.amount_paid || object.amount_due || 0,
      hosted_invoice_url: object.hosted_invoice_url || null,
      invoice_pdf: object.invoice_pdf || null,
      paid_at: status === "paid" ? fromStripeTimestamp(object.status_transitions?.paid_at) : null,
    },
  });
  return userId;
}

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      GET: () => new Response("AIRank Stripe Webhook Handler Active", { status: 200 }),
      POST: async ({ request }) => {
        const rawBody = await request.text();
        if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"))) {
          return new Response(JSON.stringify({ error: "Invalid Stripe signature" }), { status: 400 });
        }

        try {
          const event = JSON.parse(rawBody) as StripeEvent;
          const prior = await db.select().from(billingEvents)
            .where(eq(billingEvents.stripe_event_id, event.id))
            .limit(1);
          if (prior[0]) return Response.json({ received: true, duplicate: true });

          const object = event.data.object;
          const userId = await findUserId(object);
          await recordEvent(event, userId);

          if (event.type === "checkout.session.completed") {
            if (!userId) throw new Error("Missing AIRank user id on checkout session.");
            await upsertSubscription(userId, object, object.subscription ? "active" : "active");
            await queueEmail(userId, "subscription_activated", "Your AIRank subscription is active", "Your AIRank subscription has been activated.");

            const amountCents = object.amount_total || 0;
            const { convertReferral } = await import("../lib/api/referral.functions");
            await convertReferral(userId, amountCents);
          }

          if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
            if (!userId) throw new Error("Missing AIRank user id on subscription event.");
            await upsertSubscription(userId, object);
            if (object.status === "trialing") {
              await queueEmail(userId, "trial_started", "Your AIRank trial has started", "Your trial is active. You can manage billing any time from AIRank.");
            }
          }

          if (event.type === "customer.subscription.deleted") {
            await db.update(subscriptions)
              .set({ status: "canceled", updated_at: new Date() })
              .where(eq(subscriptions.stripe_subscription_id, object.id));
            await queueEmail(userId, "cancellation_confirmation", "Your AIRank subscription was cancelled", "Your subscription has been cancelled.");
          }

          if (event.type === "invoice.payment_failed") {
            const invoiceUserId = await recordInvoice(object, "failed");
            const targetUserId = userId || invoiceUserId;
            if (object.subscription) {
              await db.update(subscriptions)
                .set({ status: "past_due", updated_at: new Date() })
                .where(eq(subscriptions.stripe_subscription_id, object.subscription));
            }
            await queueEmail(targetUserId, "payment_failed", "AIRank payment failed", "We could not process your latest payment. Please update your billing method.");
          }

          if (event.type === "invoice.paid") {
            const invoiceUserId = await recordInvoice(object, "paid");
            const targetUserId = userId || invoiceUserId;
            if (object.subscription) {
              await db.update(subscriptions)
                .set({ status: "active", updated_at: new Date() })
                .where(and(eq(subscriptions.stripe_subscription_id, object.subscription), eq(subscriptions.status, "past_due")));
            }
            await queueEmail(targetUserId, "payment_success", "AIRank payment received", "Your AIRank payment was successful.");

            if (targetUserId && object.billing_reason === "subscription_create") {
              const { convertReferral } = await import("../lib/api/referral.functions");
              await convertReferral(targetUserId, object.amount_paid || 0);
            }
          }

          return Response.json({ received: true });
        } catch (err: any) {
          console.error("[STRIPE WEBHOOK ERROR]", err);
          return new Response(JSON.stringify({ error: err.message }), { status: 400 });
        }
      },
    },
  },
});
