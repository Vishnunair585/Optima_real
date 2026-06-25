import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";
import {
  activateMockSubscriptionFn,
  cancelSubscriptionFn,
  createCheckoutSessionFn,
  getBillingPortalFn,
  getPaymentHistoryFn,
  getSubscriptionStatusFn,
  inviteTeamMemberFn,
  updateTeamSeatsFn,
} from "../lib/api/billing.functions";

const billingSearchSchema = z.object({
  success: z.string().optional(),
  plan: z.string().optional(),
  cycle: z.string().optional(),
  cancel: z.string().optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/billing")({
  validateSearch: (search) => billingSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Billing & Subscription - AIRank" },
      { name: "description", content: "Manage AIRank SaaS subscriptions, invoices, team seats, and billing settings." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <BillingPage />
    </ProtectedRoute>
  ),
});

function formatDate(date?: string | Date | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{unlimited ? `${used} / unlimited` : `${used} / ${limit}`}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BillingPage() {
  const search = useSearch({ from: "/billing" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [yearly, setYearly] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [seats, setSeats] = useState(1);
  const [inviteEmail, setInviteEmail] = useState("");
  const [action, setAction] = useState<string | null>(null);

  const plans = useMemo(() => [
    {
      name: "Free" as const,
      price: 0,
      yearlyPrice: 0,
      description: "For evaluating AIRank with basic monthly limits.",
      features: ["5 Tool Comparisons per Month", "5 Saved Stacks", "Basic Reviews Access", "Basic Analytics"],
      icon: ShieldCheck,
    },
    {
      name: "Pro" as const,
      price: 20,
      yearlyPrice: 180,
      description: "For individual builders who compare, save, and analyze AI tools constantly.",
      features: ["Unlimited Comparisons", "Unlimited Saved Stacks", "AI Recommendations", "Premium Insights", "Advanced Analytics", "Priority Features"],
      icon: Sparkles,
      popular: true,
      trial: "7-day trial",
    },
    {
      name: "Team" as const,
      price: 49,
      yearlyPrice: 440,
      description: "For teams standardizing AI tools across shared workspaces and collections.",
      features: ["Everything in PRO", "Team Workspaces", "Shared Collections", "Team Analytics", "Role Management", "Collaboration Features"],
      icon: Users,
      trial: "14-day trial",
    },
  ], []);

  async function loadBilling() {
    const [statusData, paymentData] = await Promise.all([
      getSubscriptionStatusFn(),
      getPaymentHistoryFn().catch(() => []),
    ]);
    setStatus(statusData);
    setPayments(paymentData);
    setSeats(statusData.team?.seats_purchased || 1);
  }

  useEffect(() => {
    async function boot() {
      try {
        if (search.success === "true" && search.plan && !search.session_id) {
          await activateMockSubscriptionFn({
            planName: search.plan as "Pro" | "Team",
            cycle: (search.cycle || "monthly") as "monthly" | "yearly",
          });
          toast.success(`${search.plan} is active. Billing webhooks handle this automatically in Stripe mode.`);
          navigate({ to: "/billing", replace: true });
        } else if (search.success === "true") {
          toast.success("Checkout completed. Your plan will update as soon as Stripe sends the webhook.");
          navigate({ to: "/billing", replace: true });
        } else if (search.cancel === "true") {
          toast.info("Checkout canceled. No payment was collected.");
          navigate({ to: "/billing", replace: true });
        }
        await loadBilling();
      } catch (err: any) {
        toast.error(err.message || "Failed to load billing.");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [search.success, search.cancel, search.plan, search.cycle, search.session_id]);

  async function checkout(planName: "Pro" | "Team") {
    setAction(`checkout-${planName}`);
    try {
      const res = await createCheckoutSessionFn({
        planName,
        cycle: yearly ? "yearly" : "monthly",
        couponCode: couponCode || undefined,
        seats: planName === "Team" ? seats : 1,
      });
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Checkout failed.");
      setAction(null);
    }
  }

  async function openPortal() {
    setAction("portal");
    try {
      const res = await getBillingPortalFn();
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Could not open billing portal.");
      setAction(null);
    }
  }

  async function cancelPlan() {
    setAction("cancel");
    try {
      await cancelSubscriptionFn({ atPeriodEnd: true });
      toast.success("Cancellation scheduled. Your access remains through the current period.");
      await loadBilling();
    } catch (err: any) {
      toast.error(err.message || "Could not cancel subscription.");
    } finally {
      setAction(null);
    }
  }

  async function saveSeats() {
    setAction("seats");
    try {
      await updateTeamSeatsFn({ seats });
      toast.success("Team seats updated.");
      await loadBilling();
    } catch (err: any) {
      toast.error(err.message || "Could not update seats.");
    } finally {
      setAction(null);
    }
  }

  async function inviteMember() {
    setAction("invite");
    try {
      await inviteTeamMemberFn({ email: inviteEmail, role: "member" });
      setInviteEmail("");
      toast.success("Invitation queued.");
      await loadBilling();
    } catch (err: any) {
      toast.error(err.message || "Could not invite member.");
    } finally {
      setAction(null);
    }
  }

  if (loading || !status) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  const activePaid = status.plan !== "Free";

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Subscription Billing</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Plans, usage, and invoices</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upgrade, downgrade, manage renewal dates, payment history, team seats, trials, coupons, and secure Stripe billing.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-xs">
          <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-2 font-semibold ${!yearly ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Monthly</button>
          <button onClick={() => setYearly(true)} className={`rounded-full px-4 py-2 font-semibold ${yearly ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Yearly <span className="font-mono">save 25%</span></button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand/10 text-brand">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">Current plan</p>
                <h2 className="text-2xl font-black">{status.plan}</h2>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-semibold text-foreground">{status.status}</span> · Renewal: {formatDate(status.current_period_end)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {activePaid && (
                <>
                  <button onClick={openPortal} disabled={action === "portal"} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50">
                    <CreditCard className="h-4 w-4" /> Manage Billing
                  </button>
                  <button onClick={cancelPlan} disabled={action === "cancel"} className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-500/30 px-4 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <UsageMeter label="Tool comparisons" used={status.usage.comparisons} limit={status.limits.comparisons_limit} />
            <UsageMeter label="Saved stacks" used={status.usage.stacks} limit={status.limits.stacks_limit} />
            <UsageMeter label="Saved tools" used={status.usage.saved_tools} limit={status.limits.saved_tools_limit} />
            <UsageMeter label="Premium features" used={status.usage.premium_features} limit={status.limits.premium_feature_limit} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-brand" />
            <div>
              <h3 className="font-bold">Monthly reset</h3>
              <p className="text-xs text-muted-foreground">{formatDate(status.usage.reset_at)}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="Discount or referral code"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
            <p className="text-xs text-muted-foreground">Stripe promotion codes are supported at checkout. Local campaign codes can map to Stripe promotion IDs.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const current = status.plan === plan.name;
          const monthlyEquivalent = yearly && plan.yearlyPrice ? Math.round(plan.yearlyPrice / 12) : plan.price;
          return (
            <div key={plan.name} className={`relative flex min-h-[430px] flex-col rounded-lg border p-6 ${plan.popular ? "border-brand bg-brand/5" : "border-border bg-card"}`}>
              {plan.popular && <div className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase text-brand-foreground">Popular</div>}
              <Icon className="h-6 w-6 text-brand" />
              <h3 className="mt-4 text-xl font-black">{plan.name}</h3>
              <p className="mt-2 min-h-[42px] text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-black">${monthlyEquivalent}</span>
                <span className="pb-1 text-xs text-muted-foreground">/mo{yearly && plan.yearlyPrice ? ", billed yearly" : ""}</span>
              </div>
              {plan.trial && <p className="mt-2 text-xs font-semibold text-emerald-400">{plan.trial} included</p>}
              {plan.name === "Team" && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Seats</span>
                  <input type="number" min={1} max={100} value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm" />
                </div>
              )}
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {current ? (
                <button disabled className="mt-6 h-11 rounded-lg border border-brand/30 bg-brand/10 text-sm font-bold text-brand">Current Plan</button>
              ) : plan.name === "Free" ? (
                <button disabled className="mt-6 h-11 rounded-lg border border-border text-sm font-bold text-muted-foreground">Included</button>
              ) : (
                <button onClick={() => checkout(plan.name)} disabled={action !== null} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground shadow-glow disabled:opacity-50">
                  {action === `checkout-${plan.name}` ? "Opening Checkout..." : `Upgrade to ${plan.name}`} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </section>

      {status.plan === "Free" && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-300" />
            <div>
              <h3 className="font-bold">Free limit paywall is active</h3>
              <p className="text-sm text-muted-foreground">When you reach 5 comparisons or 5 saved stacks, AIRank blocks the action and prompts an upgrade to Pro or Team.</p>
            </div>
          </div>
          <button onClick={() => checkout("Pro")} disabled={action !== null} className="h-10 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">Unlock Pro</button>
        </section>
      )}

      {status.plan === "Team" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-brand">Team billing</p>
              <h2 className="text-xl font-black">Seats and members</h2>
              <p className="text-sm text-muted-foreground">{status.team?.activeSeats || 0} of {status.team?.seats_purchased || seats} seats in use</p>
            </div>
            <div className="flex gap-2">
              <input value={seats} onChange={(event) => setSeats(Number(event.target.value))} type="number" min={1} max={100} className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm" />
              <button onClick={saveSeats} disabled={action === "seats"} className="h-10 rounded-lg border border-border px-4 text-sm font-bold hover:bg-accent">Save Seats</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" className="h-10 min-w-64 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
            <button onClick={inviteMember} disabled={action === "invite"} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-brand-foreground">
              <UserPlus className="h-4 w-4" /> Invite
            </button>
          </div>
          <div className="mt-5 divide-y divide-border/60">
            {(status.team?.members || []).map((member: any) => (
              <div key={member.id} className="flex items-center justify-between py-3 text-sm">
                <span>{member.email}</span>
                <span className="font-mono text-xs uppercase text-muted-foreground">{member.role} · {member.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <Receipt className="h-5 w-5 text-brand" />
          <div>
            <h2 className="font-black">Payment history</h2>
            <p className="text-xs text-muted-foreground">Invoices are written from Stripe `invoice.paid` and `invoice.payment_failed` webhooks.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="py-3">Invoice</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No invoices yet.</td></tr>
              ) : payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs">{payment.stripe_invoice_id || payment.id}</td>
                  <td className="py-3">{formatCurrency(payment.amount_paid, payment.currency)}</td>
                  <td className="py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">{payment.status}</span></td>
                  <td className="py-3 text-muted-foreground">{formatDate(payment.paid_at || payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Webhook Verification", "Stripe signatures are validated before billing mutations."],
          ["Payment Validation", "Subscription state changes are driven by Stripe checkout and invoice events."],
          ["Billing Emails", "Activation, payment, renewal, and cancellation emails are queued for delivery."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <Crown className="h-5 w-5 text-brand" />
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
