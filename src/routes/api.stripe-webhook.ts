import { createFileRoute } from "@tanstack/react-router";
import { db } from "../lib/db";
import { subscriptions } from "../lib/db/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      GET: () => {
        return new Response("AIRank Stripe Webhook Handler Active", { status: 200 });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const eventType = body.type;

          console.log(`[STRIPE WEBHOOK] Received event: ${eventType}`);

          // Process event types
          if (eventType === "checkout.session.completed") {
            const session = body.data.object;
            const userId = session.client_reference_id || session.metadata?.user_id;
            const planName = session.metadata?.plan_name || "Pro";
            const cycle = session.metadata?.billing_cycle || "monthly";

            if (userId) {
              const start = new Date();
              const end = new Date();
              if (cycle === "yearly") {
                end.setFullYear(end.getFullYear() + 1);
              } else {
                end.setMonth(end.getMonth() + 1);
              }

              // Check if subscription already exists
              const existing = await db.select().from(subscriptions)
                .where(eq(subscriptions.user_id, userId))
                .limit(1);

              if (existing.length > 0) {
                await db.update(subscriptions)
                  .set({
                    plan_name: planName,
                    status: "active",
                    billing_cycle: cycle,
                    current_period_start: start,
                    current_period_end: end,
                    stripe_customer_id: session.customer || "mock_cust",
                    stripe_subscription_id: session.subscription || "mock_sub",
                    updated_at: new Date()
                  })
                  .where(eq(subscriptions.user_id, userId));
              } else {
                await db.insert(subscriptions).values({
                  id: crypto.randomUUID(),
                  user_id: userId,
                  stripe_customer_id: session.customer || "mock_cust",
                  stripe_subscription_id: session.subscription || "mock_sub",
                  plan_name: planName,
                  status: "active",
                  billing_cycle: cycle,
                  current_period_start: start,
                  current_period_end: end
                });
              }
              console.log(`[STRIPE WEBHOOK] Subscription activated for user ${userId}`);
            }
          }

          if (eventType === "customer.subscription.deleted") {
            const subscription = body.data.object;
            const stripeSubId = subscription.id;

            await db.update(subscriptions)
              .set({ status: "canceled", updated_at: new Date() })
              .where(eq(subscriptions.stripe_subscription_id, stripeSubId));
            
            console.log(`[STRIPE WEBHOOK] Subscription canceled: ${stripeSubId}`);
          }

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err: any) {
          console.error("[STRIPE WEBHOOK ERROR]", err);
          return new Response(JSON.stringify({ error: err.message }), { status: 400 });
        }
      }
    }
  }
});
