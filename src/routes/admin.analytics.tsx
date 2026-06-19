import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "../components/auth/route-guard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { 
  getAnalyticsSummaryFn, getRealTimeAnalyticsFn 
} from "../lib/api/analytics.functions";
import { 
  TrendingUp, Users, Clock, Globe, Search, RefreshCw, 
  Download, AlertTriangle, Play, HelpCircle 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Analytics — Admin Console" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <ProtectedRoute requireRole="Admin">
      <AdminAnalyticsDashboard />
    </ProtectedRoute>
  ),
});

function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [realtime, setRealtime] = useState<any>({ liveActiveUsers: 0, liveEvents: [] });
  const [alertThreshold, setAlertThreshold] = useState("50");
  const [pollingActive, setPollingActive] = useState(true);

  const fetchAllData = async () => {
    try {
      const sum = await getAnalyticsSummaryFn();
      const rt = await getRealTimeAnalyticsFn();
      setSummary(sum);
      setRealtime(rt);
    } catch (err: any) {
      toast.error(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Poll real-time data every 10 seconds
  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(async () => {
      try {
        const rt = await getRealTimeAnalyticsFn();
        setRealtime(rt);
      } catch (e) {
        console.warn("Realtime poll failed");
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [pollingActive]);

  const exportCSV = () => {
    if (!summary) return;
    const headers = ["Metric/Step", "Count", "Additional Info"];
    const rows = [
      ["DAU", summary.dau.toString(), "Daily Active Users"],
      ["WAU", summary.wau.toString(), "Weekly Active Users"],
      ["MAU", summary.mau.toString(), "Monthly Active Users"],
      ...summary.funnel.map((f: any) => [`Funnel: ${f.step}`, f.count.toString(), `Dropoff: ${f.dropOff}%`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `optima_admin_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported!");
  };

  const triggerMockAlertTest = () => {
    toast.warning("ALERT: High traffic anomaly detected! Traffic spike: +150% in past 5 minutes.", {
      duration: 6000,
    });
  };

  if (loading || !summary) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-brand animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Compiling metrics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#a855f7", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Operational Intelligence</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-brand bg-clip-text text-transparent">
            Optima Platform Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Product analytics, user retention cohorts, conversion funnels, search terms, and live server telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPollingActive(!pollingActive);
              toast.info(pollingActive ? "Real-time polling disabled." : "Real-time polling enabled.");
            }}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-all ${
              pollingActive ? "border-brand bg-brand/5 text-brand" : "border-border hover:bg-accent text-muted-foreground"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pollingActive ? "animate-spin" : ""}`} /> 
            {pollingActive ? "Live Sync On" : "Live Sync Off"}
          </button>
          
          <button
            onClick={exportCSV}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-brand-foreground shadow-glow cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV Report
          </button>
        </div>
      </header>

      {/* Top Level Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Daily Actives (DAU)</p>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">{summary.dau}</p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">▲ +8.2% vs yesterday</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Weekly Actives (WAU)</p>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">{summary.wau}</p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">▲ +4.5% vs last week</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Monthly Actives (MAU)</p>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">{summary.mau}</p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">▲ +12.3% vs last month</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Live Active Visitors</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mt-1.5" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-400">{realtime.liveActiveUsers}</p>
          <span className="text-[10px] text-muted-foreground font-mono mt-1 block">Unique sessions last 15 min</span>
        </div>
      </div>

      {/* Main Row: Funnel Chart on Left, Live Actions on Right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Funnel Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight mb-1">Conversion Funnel Drop-offs</h3>
            <p className="text-xs text-muted-foreground">Product events trace from first account creation to workflow build.</p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="step" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#0b0a14", border: "1px solid #1f2937", borderRadius: "12px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Bar dataKey="count" fill="url(#funnelGrad)" radius={[6, 6, 0, 0]}>
                  {summary.funnel.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 border-t border-border/40 pt-4 grid grid-cols-4 gap-2 text-center text-xs">
            {summary.funnel.slice(1, 5).map((f: any) => (
              <div key={f.step}>
                <p className="text-muted-foreground truncate">{f.step}</p>
                <p className="font-bold text-rose-400 mt-0.5">-{f.dropOff}% drop</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Event Stream Feed */}
        <div className="glass p-6 rounded-2xl border border-border flex flex-col h-[400px]">
          <h3 className="text-sm font-bold tracking-tight mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" /> Live Telemetry Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {realtime.liveEvents.map((evt: any) => (
              <div key={evt.id} className="text-xs p-3 rounded-lg border border-border/20 bg-card/40 hover:bg-accent transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{evt.event_name}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>URL: {evt.page_url}</span>
                  <span>{evt.user_name}</span>
                </div>
              </div>
            ))}
            {realtime.liveEvents.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-12">Waiting for events on the platform...</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Cohorts, Search Terms, Geographics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Retention Cohort Table */}
        <div className="glass p-6 rounded-2xl border border-border space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">User Cohort Retention</h3>
            <p className="text-[11px] text-muted-foreground">Cohort group active parameters by signup date.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/40 pb-2">
                  <th className="pb-2 text-muted-foreground">Cohort</th>
                  <th className="pb-2 text-muted-foreground">Size</th>
                  <th className="pb-2 text-muted-foreground">D1</th>
                  <th className="pb-2 text-muted-foreground">D7</th>
                  <th className="pb-2 text-muted-foreground">D30</th>
                </tr>
              </thead>
              <tbody>
                {summary.cohorts.map((c: any) => (
                  <tr key={c.cohort} className="border-b border-border/20 last:border-0">
                    <td className="py-2.5 font-medium">{c.cohort}</td>
                    <td className="py-2.5 font-mono">{c.size}</td>
                    <td className="py-2.5 text-emerald-400">{c.day1}</td>
                    <td className="py-2.5 text-emerald-400/80">{c.day7}</td>
                    <td className="py-2.5 text-cyan-400">{c.day30}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Search Queries */}
        <div className="glass p-6 rounded-2xl border border-border space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Top Search Telemetry</h3>
            <p className="text-[11px] text-muted-foreground">Most queries search terms and target conversion rates.</p>
          </div>

          <div className="space-y-3">
            {summary.topSearches.map((s: any) => (
              <div key={s.query} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-border/20 bg-card/25">
                <span className="font-medium">"{s.query}"</span>
                <div className="flex items-center gap-3 text-muted-foreground font-mono">
                  <span>{s.count} searches</span>
                  <span className="text-emerald-400 font-semibold">{s.conversions} conversion</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic & Alert Console */}
        <div className="glass p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Security & Operation Alerts</h3>
              <p className="text-[11px] text-muted-foreground">Define thresholds for automated traffic abnormality alerts.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Traffic Spike Threshold</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="flex-1 h-9 px-2.5 rounded border border-border bg-background text-xs outline-none focus:border-brand"
                  />
                  <span className="grid place-items-center text-xs bg-muted border border-border/40 px-3 rounded-lg text-muted-foreground font-mono">%</span>
                </div>
              </div>

              <button
                onClick={triggerMockAlertTest}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs font-semibold transition-all cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" /> Trigger Alert Simulation
              </button>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4 mt-4">
            <h4 className="text-xs font-mono uppercase text-muted-foreground mb-2">Users by country</h4>
            <div className="space-y-2">
              {summary.geo.map((g: any) => (
                <div key={g.country} className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> {g.country}</span>
                  <span className="font-bold">{g.count} sessions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature & Tools Analytics */}
      <div className="glass p-6 rounded-2xl border border-border space-y-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">Feature Popularity Distribution</h3>
          <p className="text-xs text-muted-foreground">Telemetry counts of exact page event clicks and workflows.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {summary.featureUsage.slice(0, 6).map((f: any) => (
            <div key={f.feature} className="p-3.5 rounded-xl border border-border/40 bg-card/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Event Instrument</p>
                <h4 className="font-bold text-sm text-foreground mt-0.5">{f.feature}</h4>
              </div>
              <Badge className="font-mono bg-brand/10 border-brand/20 text-brand">
                {f.count} hits
              </Badge>
            </div>
          ))}
          {summary.featureUsage.length === 0 && (
            <p className="text-xs text-muted-foreground italic col-span-3 text-center py-6">Telemetry events are being processed...</p>
          )}
        </div>
      </div>
    </div>
  );
}
