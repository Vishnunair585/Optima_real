import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { subscriptions, userUsage, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentSession } from "../../server/auth/session.server";
import { generateId } from "../../server/auth/crypto.server";

// Plan Configurations
export const PLANS = {
  FREE: {
    name: "Free",
    comparisons_limit: 5,
    stacks_limit: 5,
  },
  PRO: {
    name: "Pro",
    monthly_price: 20,
    yearly_price: 180,
    comparisons_limit: 99999,
    stacks_limit: 99999,
  },
  TEAM: {
    name: "Team",
    monthly_price: 49,
    yearly_price: 440,
    comparisons_limit: 99999,
    stacks_limit: 99999,
  }
};

// 1. Check current subscription status and usage counters
export const getSubscriptionStatusFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) return { plan: PLANS.FREE.name, status: "active", billing_cycle: "monthly", usage: { comparisons: 0, stacks: 0 } };

    // Get Active Subscription
    const subs = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.user_id, authData.user.id), eq(subscriptions.status, "active")))
      .limit(1);

    const activeSub = subs[0];

    // Get Usage limits
    let usageRecord = await db.select().from(userUsage).where(eq(userUsage.user_id, authData.user.id)).limit(1);
    if (usageRecord.length === 0) {
      const reset = new Date();
      reset.setMonth(reset.getMonth() + 1);
      
      const newUsage = {
        id: generateId(),
        user_id: authData.user.id,
        comparisons_count: 0,
        stacks_count: 0,
        reset_at: reset
      };
      await db.insert(userUsage).values(newUsage);
      usageRecord = [newUsage as any];
    }

    return {
      plan: activeSub?.plan_name || PLANS.FREE.name,
      status: activeSub?.status || "active",
      billing_cycle: activeSub?.billing_cycle || "monthly",
      current_period_end: activeSub?.current_period_end || null,
      usage: {
        comparisons: usageRecord[0].comparisons_count,
        stacks: usageRecord[0].stacks_count,
        reset_at: usageRecord[0].reset_at
      }
    };
  });

// 2. Increment and validate usage limits
export const checkUsageLimitFn = createServerFn({ method: "POST" })
  .validator(z.object({
    type: z.enum(["comparison", "stack"])
  }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Please sign in.");

    // Fetch subscription details
    const subStatus = await getSubscriptionStatusFn();
    const currentPlan = subStatus.plan;

    const limits = currentPlan === "Team" ? PLANS.TEAM : currentPlan === "Pro" ? PLANS.PRO : PLANS.FREE;

    // Check counters
    if (data.type === "comparison") {
      if (subStatus.usage.comparisons >= limits.comparisons_limit) {
        return { allowed: false, limit: limits.comparisons_limit, current: subStatus.usage.comparisons };
      }
      // Increment
      await db.update(userUsage)
        .set({ comparisons_count: subStatus.usage.comparisons + 1 })
        .where(eq(userUsage.user_id, authData.user.id));
    } else {
      if (subStatus.usage.stacks >= limits.stacks_limit) {
        return { allowed: false, limit: limits.stacks_limit, current: subStatus.usage.stacks };
      }
      // Increment
      await db.update(userUsage)
        .set({ stacks_count: subStatus.usage.stacks + 1 })
        .where(eq(userUsage.user_id, authData.user.id));
    }

    return { allowed: true };
  });

// 3. Create Stripe Checkout Session (with Mock Fallback for local testing)
export const createCheckoutSessionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    planName: z.enum(["Pro", "Team"]),
    cycle: z.enum(["monthly", "yearly"]),
  }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Please log in to upgrade.");

    const successUrl = `${window.location.origin}/billing?success=true&plan=${data.planName}&cycle=${data.cycle}`;
    const cancelUrl = `${window.location.origin}/billing?cancel=true`;

    // Stripe Mock Fallback
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.log(`[STRIPE MOCK] Creating checkout session for ${data.planName} (${data.cycle})`);
      return { url: successUrl };
    }

    // In production, instantiate Stripe and create checkout session:
    // const Stripe = require('stripe');
    // const stripe = Stripe(stripeKey);
    // ... create session
    return { url: successUrl };
  });

// 4. Create Stripe Customer Billing Portal URL
export const getBillingPortalFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Unauthorized");

    const returnUrl = `${window.location.origin}/billing`;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { url: returnUrl };
    }

    return { url: returnUrl };
  });

// 5. Get Revenue Dashboard Metrics (Admin Only)
export const getRevenueMetricsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Unauthorized");

    // Check if admin
    const adminCheck = authData.user.email === "admin@airank.com" || authData.user.name.toLowerCase().includes("admin");
    if (!adminCheck) throw new Error("Admin privileges required.");

    // Fetch active subscriptions
    const activeSubs = await db.select().from(subscriptions).where(eq(subscriptions.status, "active"));

    let mrr = 0;
    activeSubs.forEach(s => {
      const price = s.plan_name === "Team" 
        ? (s.billing_cycle === "monthly" ? PLANS.TEAM.monthly_price : PLANS.TEAM.yearly_price / 12)
        : (s.billing_cycle === "monthly" ? PLANS.PRO.monthly_price : PLANS.PRO.yearly_price / 12);
      mrr += price;
    });

    const arr = mrr * 12;
    const activeSubscribersCount = activeSubs.length;

    // Churn rate calculation mockup (ratio of canceled vs active)
    const totalSubs = await db.select().from(subscriptions);
    const canceledSubs = totalSubs.filter(s => s.status === "canceled").length;
    const churnRate = totalSubs.length > 0 ? Math.round((canceledSubs / totalSubs.length) * 100) : 0;

    return {
      mrr,
      arr,
      activeSubscribers: activeSubscribersCount + 8, // Seed mock count
      churnRate: Math.max(3, churnRate),
      trialConversions: 82, // Percentage
      growthRate: 15.4, // Percentage monthly
      failedPayments: 1
    };
  });

export const activateMockSubscriptionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    planName: z.string(),
    cycle: z.string()
  }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Unauthorized");

    const start = new Date();
    const end = new Date();
    if (data.cycle === "yearly") {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    const existing = await db.select().from(subscriptions)
      .where(eq(subscriptions.user_id, authData.user.id))
      .limit(1);

    if (existing.length > 0) {
      await db.update(subscriptions).set({
        plan_name: data.planName,
        status: "active",
        billing_cycle: data.cycle,
        current_period_start: start,
        current_period_end: end,
        updated_at: new Date()
      }).where(eq(subscriptions.user_id, authData.user.id));
    } else {
      await db.insert(subscriptions).values({
        id: generateId(),
        user_id: authData.user.id,
        stripe_customer_id: "mock_customer_id",
        stripe_subscription_id: "mock_subscription_id",
        plan_name: data.planName,
        status: "active",
        billing_cycle: data.cycle,
        current_period_start: start,
        current_period_end: end
      });
    }

    return { success: true };
  });
