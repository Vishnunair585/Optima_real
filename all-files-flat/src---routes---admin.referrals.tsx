import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  RefreshCw, AlertTriangle, Trophy, Users, MousePointerClick,
  DollarSign, Gift, Shield, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "../components/auth/route-guard";
import { Badge } from "../components/ui/badge";
import {
  getReferralAnalyticsFn,
  resolveFraudAlertFn,
  sendLeaderboardDigestFn,
} from "../lib/api/referral.functions";

export const Route = createFileRoute("/admin/referrals")({
  head: () => ({
    meta: [
      { title: "Referral Admin — AIRank" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <ProtectedRoute requireRole="Admin">
      <AdminReferralsDashboard />
    </ProtectedRoute>
  ),
});

function MetricCard({ label, value, icon: Icon, format }: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: "currency" | "percent";
}) {
  const display = format === "currency"
    ? `$${(value / 100).toFixed(2)}`
    : format === "percent"
      ? `${value}%`
      : value.toLocaleString();

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="text-2xl font-extrabold">{display}</p>
    </div>
  );
}

function AdminReferralsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getReferralAnalyticsFn>> | null>(null);
  const [sendingDigest, setSendingDigest] = useState(false);

  const load = async () => {
    try {
      const analytics = await getReferralAnalyticsFn();
      setData(analytics);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load referral analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      await resolveFraudAlertFn({ data: { alertId } });
      toast.success("Alert resolved");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve alert");
    }
  };

  const sendDigest = async () => {
    setSendingDigest(true);
    try {
      const result = await sendLeaderboardDigestFn();
      toast.success(`Leaderboard digest sent to ${result.notified} users`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send digest");
    } finally {
      setSendingDigest(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const severityColor = (s: string) =>
    s === "high" ? "border-rose-500/30 text-rose-500" :
    s === "medium" ? "border-amber-500/30 text-amber-500" :
    "border-border text-muted-foreground";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Admin Console</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
            Referral Performance
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={sendDigest}
            disabled={sendingDigest}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-glow disabled:opacity-50 cursor-pointer"
          >
            <Trophy className="h-4 w-4" />
            {sendingDigest ? "Sending..." : "Send Leaderboard Digest"}
          </button>
        </div>
      </header>

      <nav className="flex gap-2 text-sm">
        <Link to="/admin/analytics" className="text-muted-foreground hover:text-foreground">Analytics</Link>
        <span className="text-muted-foreground">/</span>
        <Link to="/admin/revenue" className="text-muted-foreground hover:text-foreground">Revenue</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-brand font-medium">Referrals</span>
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Referral Clicks" value={data.clicks} icon={MousePointerClick} />
        <MetricCard label="Signups" value={data.signups} icon={Users} />
        <MetricCard label="Conversions" value={data.conversions} icon={Trophy} />
        <MetricCard label="Conversion Rate" value={data.conversion_rate} icon={Users} format="percent" />
        <MetricCard label="Revenue Generated" value={data.revenue_cents} icon={DollarSign} format="currency" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top referrers */}
        <section className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Top Referrers
          </h2>
          {data.top_referrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrers yet.</p>
          ) : (
            <div className="space-y-2">
              {data.top_referrers.map((r, i) => (
                <div key={r.user_id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand">{r.referrals} refs</p>
                    <p className="text-[10px] font-mono text-muted-foreground">${(r.revenue_cents / 100).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reward distribution */}
        <section className="rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand" /> Reward Distribution
          </h2>
          {data.rewards_distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rewards granted yet.</p>
          ) : (
            <div className="space-y-2">
              {data.rewards_distribution.map((r) => (
                <div key={r.reward_type} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                  <span className="text-sm font-medium capitalize">{r.reward_type.replace(/_/g, " ")}</span>
                  <Badge variant="outline">{r.count} granted</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Fraud alerts */}
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-500" /> Fraud Alerts
          {data.fraud_alerts.length > 0 && (
            <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">{data.fraud_alerts.length} open</Badge>
          )}
        </h2>
        {data.fraud_alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            No open fraud alerts.
          </div>
        ) : (
          <div className="space-y-2">
            {data.fraud_alerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{alert.alert_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{alert.user_name} · {new Date(alert.created_at!).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={severityColor(alert.severity)}>{alert.severity}</Badge>
                  <button
                    type="button"
                    onClick={() => resolveAlert(alert.id)}
                    className="text-xs text-brand hover:underline cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
