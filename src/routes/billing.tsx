import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "../components/auth/route-guard";
import { 
  Check, CreditCard, Sparkles, AlertCircle, RefreshCw, 
  HelpCircle, ShieldCheck, CheckCircle2, ChevronRight 
} from "lucide-react";
import { 
  getSubscriptionStatusFn, createCheckoutSessionFn, 
  getBillingPortalFn, activateMockSubscriptionFn 
} from "../lib/api/billing.functions";
import { toast } from "sonner";
import { z } from "zod";

const billingSearchSchema = z.object({
  success: z.string().optional(),
  plan: z.string().optional(),
  cycle: z.string().optional(),
  cancel: z.string().optional(),
});

export const Route = createFileRoute("/billing")({
  validateSearch: (search) => billingSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Subscription Plans & Billing — Optima" },
      { name: "description", content: "Upgrade your account to unlock premium AI insights, unlimited stacks, and comparisons." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <BillingPlansPage />
    </ProtectedRoute>
  ),
});

function BillingPlansPage() {
  const searchParams = useSearch({ from: "/billing" });
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await getSubscriptionStatusFn();
      setSubStatus(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if redirected from a successful checkout session (Stripe callback helper)
    async function handleSuccessCallback() {
      if (searchParams.success === "true" && searchParams.plan) {
        try {
          await activateMockSubscriptionFn({
            planName: searchParams.plan,
            cycle: searchParams.cycle || "monthly"
          });
          toast.success(`Welcome to ${searchParams.plan}! Your subscription is now active.`);
          // Clear query params
          navigate({ to: "/billing", replace: true });
        } catch (e) {
          console.error("Callback activation failed");
        }
      } else if (searchParams.cancel === "true") {
        toast.info("Checkout canceled. No charges were made.");
        navigate({ to: "/billing", replace: true });
      }
      fetchStatus();
    }
    handleSuccessCallback();
  }, [searchParams]);

  const handleUpgrade = async (planName: "Pro" | "Team") => {
    setActionLoading(planName);
    try {
      const cycle = yearly ? "yearly" : "monthly";
      const res = await createCheckoutSessionFn({ planName, cycle });
      // Redirect to Checkout page
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Checkout session failed.");
      setActionLoading(null);
    }
  };

  const handlePortalRedirect = async () => {
    setActionLoading("portal");
    try {
      const res = await getBillingPortalFn();
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to launch billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !subStatus) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  const plansList = [
    {
      name: "Free",
      price: 0,
      description: "Essential tools for personal evaluation and basic AI discoveries.",
      features: [
        "5 Tool Comparisons per Month",
        "5 Saved Custom Stacks",
        "Basic Reviews Access",
        "Basic Analytics Dashboard"
      ],
      limits: "5 comparisons/mo limit"
    },
    {
      name: "Pro",
      price: yearly ? 15 : 20, // 25% discount on yearly
      description: "Unlock advanced insights, unlimited comparisons, and custom recommendations.",
      features: [
        "Unlimited Tool Comparisons",
        "Unlimited Custom AI Stacks",
        "AI Recommendation Engine",
        "Premium Insights & Metrics",
        "Advanced Analytics Report",
        "Priority Feature Access",
        "14-Day Free Trial"
      ],
      limits: "Everything you need to scale",
      popular: true,
    },
    {
      name: "Team",
      price: yearly ? 37 : 49,
      description: "Perfect for squads, design agencies, and startup workspaces.",
      features: [
        "Everything in PRO plan",
        "Team Workspaces & Seats",
        "Shared Stack Collections",
        "Team Usage Analytics Dashboard",
        "Seat & Role Management",
        "Collaboration comments & permissions"
      ],
      limits: "Built for team execution"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <header className="max-w-3xl mx-auto text-center space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Monetization & Plans</p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-brand bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h1>
        <p className="text-base text-muted-foreground">
          Unlock high-fidelity AI workflows and unlimited engine comparisons with Optima premium plans.
        </p>

        {/* Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-mono font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly Billing</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative h-6 w-11 rounded-full bg-muted border border-border/60 transition-colors outline-none cursor-pointer"
          >
            <div className={`h-4.5 w-4.5 rounded-full bg-brand shadow-glow absolute top-0.5 transition-all ${yearly ? "left-5.5" : "left-0.5"}`} />
          </button>
          <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly Billing <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Save 25%</span>
          </span>
        </div>
      </header>

      {/* Current Subscription Status banner */}
      <div className="max-w-4xl mx-auto border border-brand/20 bg-brand/5 p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 border border-brand/20 text-brand">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Your Active Plan: <span className="text-brand font-extrabold">{subStatus.plan}</span></h3>
              <Badge className="text-[9px] uppercase font-mono bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                {subStatus.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usage: <span className="text-foreground font-semibold">{subStatus.usage.comparisons}</span>/5 comparisons used • <span className="text-foreground font-semibold">{subStatus.usage.stacks}</span>/5 stacks created.
            </p>
          </div>
        </div>

        {subStatus.plan !== "Free" ? (
          <button
            onClick={handlePortalRedirect}
            disabled={actionLoading === "portal"}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50 transition-all cursor-pointer"
          >
            {actionLoading === "portal" ? "Connecting..." : "Manage Billing & Cancel"}
          </button>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">Select a plan below to upgrade your account.</span>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
        {plansList.map((p) => {
          const isCurrent = subStatus.plan.toLowerCase() === p.name.toLowerCase();
          
          return (
            <div 
              key={p.name}
              className={`flex flex-col justify-between rounded-3xl border p-8 relative overflow-hidden transition-all duration-300 ${
                p.popular 
                  ? "border-brand bg-brand/5 shadow-elegant scale-[1.02]" 
                  : "border-border/80 bg-card/30 hover:border-brand/30"
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 right-0 flex items-center gap-1 bg-brand px-4 py-1 rounded-bl-2xl text-[9px] font-mono tracking-wider text-brand-foreground font-bold">
                  <Sparkles className="h-3 w-3" /> POPULAR
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{p.description}</p>
                </div>

                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-foreground">${p.price}</span>
                  <span className="text-muted-foreground text-xs ml-1 font-mono">/{yearly ? "mo, billed yearly" : "mo"}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full h-11 border border-brand/20 bg-brand/5 text-brand rounded-2xl font-bold text-sm text-center"
                  >
                    Current Plan
                  </button>
                ) : p.name === "Free" ? (
                  <button
                    disabled
                    className="w-full h-11 border border-border bg-muted/20 text-muted-foreground rounded-2xl font-semibold text-sm text-center"
                  >
                    Basic Limits Enabled
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(p.name as any)}
                    disabled={actionLoading !== null}
                    className="w-full h-11 bg-gradient-brand text-brand-foreground rounded-2xl font-bold text-sm shadow-glow cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {actionLoading === p.name ? "Redirecting..." : `Upgrade to ${p.name}`}
                  </button>
                )}
                
                <p className="text-[10px] text-center text-muted-foreground font-mono mt-3">
                  {p.limits}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
