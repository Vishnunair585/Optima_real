import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Gift, Users, MousePointerClick, TrendingUp, Trophy, Mail,
  RefreshCw, Crown, Sparkles, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "../components/auth/route-guard";
import { SocialShare } from "../components/referral/SocialShare";
import { Badge } from "../components/ui/badge";
import {
  getReferralDashboardFn,
  sendReferralInviteFn,
} from "../lib/api/referral.functions";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — Optima" },
      { name: "description", content: "Share Optima with friends and earn rewards for every friend who discovers AI tools with you." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ReferralsDashboard />
    </ProtectedRoute>
  ),
});

function StatCard({ label, value, icon: Icon, suffix }: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">
        {value}{suffix && <span className="text-lg text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}

function ReferralsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getReferralDashboardFn>> | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getReferralDashboardFn();
      setData(dashboard);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load referral dashboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await sendReferralInviteFn({ email: inviteEmail.trim() });
      toast.success("Invite sent!");
      setInviteEmail("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  if (loading || (!data && !error)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-rose-500 mb-2">Failed to load referral dashboard</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-glow cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const shareMessage = `I'm using Optima to discover the best AI tools. Join with my link and we both win rewards!`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Grow Together</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-brand bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Invite friends to discover the best AI tools with you. Earn rewards for every person who joins and builds their stack.
          </p>
        </div>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          Leaderboard
        </Link>
      </header>

      {/* Referral link card */}
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-transparent p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold">Your Referral Link</h2>
            </div>
            <div className="rounded-xl border border-border bg-background/80 px-4 py-3 font-mono text-sm break-all">
              {data.link}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Code:</span>
              <Badge variant="outline" className="font-mono text-brand border-brand/30">{data.code}</Badge>
            </div>
          </div>
          <div className="lg:w-80">
            <SocialShare link={data.link} message={shareMessage} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Link Clicks" value={data.stats.link_clicks} icon={MousePointerClick} />
        <StatCard label="Signups" value={data.stats.signups} icon={Users} />
        <StatCard label="Successful Referrals" value={data.stats.successful_referrals} icon={Sparkles} />
        <StatCard label="Conversion Rate" value={data.stats.conversion_rate} icon={TrendingUp} suffix="%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Invites Sent" value={data.stats.invites_sent} icon={Mail} />
        <StatCard label="Paid Conversions" value={data.stats.conversions} icon={Crown} />
        <StatCard label="Rewards Earned" value={data.stats.rewards_earned} icon={Gift} />
      </div>

      {/* Milestones */}
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-bold mb-4">Reward Milestones</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.milestones.map((m) => {
            const earned = data.qualified_count >= m.referral_count;
            return (
              <div
                key={m.id}
                className={`rounded-xl border p-4 transition-all ${earned ? "border-brand/40 bg-brand/5" : "border-border bg-card/60"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{m.referral_count} referral{m.referral_count > 1 ? "s" : ""}</span>
                  {earned && <Badge className="bg-brand/20 text-brand border-0 text-[10px]">Earned</Badge>}
                </div>
                <p className="font-semibold text-sm">{m.label}</p>
                {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Progress: {data.qualified_count} qualified referral{data.qualified_count !== 1 ? "s" : ""}
        </p>
      </section>

      {/* Badges */}
      {data.badges.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="text-lg font-bold mb-4">Your Badges</h2>
          <div className="flex flex-wrap gap-3">
            {data.badges.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2">
                <span>{(b as { icon?: string }).icon || "🏅"}</span>
                <span className="text-sm font-medium">{(b as { label?: string }).label || b.badge_key}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Email invite */}
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-bold mb-2">Invite by Email</h2>
        <p className="text-sm text-muted-foreground mb-4">Send a personalized invite directly to a friend's inbox.</p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={inviting}
            className="h-11 px-6 rounded-xl bg-gradient-brand text-brand-foreground text-sm font-semibold shadow-glow disabled:opacity-50 cursor-pointer"
          >
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </section>

      {/* Recent referrals */}
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-bold mb-4">Recent Referrals</h2>
        {data.referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Revenue</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">{ref.referred_name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={
                        ref.status === "converted" ? "border-emerald-500/30 text-emerald-500" :
                        ref.status === "qualified" ? "border-brand/30 text-brand" :
                        ref.status === "fraud" ? "border-rose-500/30 text-rose-500" :
                        "border-border text-muted-foreground"
                      }>
                        {ref.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-mono">${(ref.revenue_cents / 100).toFixed(2)}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(ref.created_at!).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="text-center">
        <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
          See who's leading the referral leaderboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
