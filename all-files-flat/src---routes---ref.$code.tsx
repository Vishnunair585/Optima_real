import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Sparkles, Users, ArrowRight, Loader2 } from "lucide-react";
import { getReferralLandingFn, trackReferralClickFn } from "../lib/api/referral.functions";
import { storeReferralCode } from "../lib/referral/constants";

export const Route = createFileRoute("/ref/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Join AIRank — Referral ${params.code}` },
      { name: "description", content: "You've been invited to AIRank. Discover, compare, and build your AI tool stack." },
    ],
  }),
  component: ReferralLandingPage,
});

function ReferralLandingPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [landing, setLanding] = useState<Awaited<ReturnType<typeof getReferralLandingFn>> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const sessionId = typeof crypto !== "undefined" ? crypto.randomUUID() : "anon";
        await trackReferralClickFn({ data: { code, sessionId } });
        storeReferralCode(code.toUpperCase());

        const data = await getReferralLandingFn({ data: { code } });
        if (mounted) setLanding(data);
      } catch {
        if (mounted) setLanding({ valid: false });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!landing?.valid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Invalid Referral Link</h1>
        <p className="mt-2 text-muted-foreground">This referral code doesn't exist or has expired.</p>
        <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground">
          Sign up anyway <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-brand mb-6">
          <Gift className="h-3.5 w-3.5" />
          You're invited
        </div>

        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-brand text-3xl font-bold text-brand-foreground shadow-glow overflow-hidden">
          {landing.referrer_avatar?.startsWith("data:") ? (
            <img src={landing.referrer_avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            landing.referrer_name.charAt(0).toUpperCase()
          )}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          <span className="text-gradient">{landing.referrer_name}</span> invited you to AIRank
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Discover, compare, and build your perfect AI tool stack. Join thousands of builders finding the best AI tools.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-brand" /> AI Tool Discovery
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
            <Users className="h-3.5 w-3.5 text-brand" /> {landing.qualified_referrals}+ referrals
          </span>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/signup" })}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-brand px-8 text-sm font-semibold text-brand-foreground shadow-glow transition-transform hover:scale-[1.02] cursor-pointer"
          >
            Accept Invitation <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/"
            className="inline-flex h-12 items-center rounded-full border border-border px-6 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Learn more
          </Link>
        </div>

        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Referral code: <span className="text-brand">{landing.code}</span>
        </p>
      </div>
    </div>
  );
}
