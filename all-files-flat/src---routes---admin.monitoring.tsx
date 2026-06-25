import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMonitoringDashboardDataFn,
  triggerHealthCheckFn,
  triggerBackupFn,
  acknowledgeAlertFn,
  resolveSecurityEventFn,
  sendTestAlertFn,
} from "../lib/api/monitoring.functions";
import {
  Activity, AlertTriangle, Server, Database, Shield, HardDrive,
  RefreshCw, Download, CheckCircle, XCircle, Clock, Users,
  Bug, Bell, FileText, Loader2
} from "lucide-react";

export const Route = createFileRoute("/admin/monitoring")({
  component: MonitoringDashboard,
});

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    degraded: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    down: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    failed: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    running: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    info: "bg-brand/10 text-brand border-brand/20",
    warn: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    critical: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors[status] || "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function MonitoringDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getMonitoringDashboardDataFn();
      setData(d);
    } catch (err: any) {
      toast.error("Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleHealthCheck = async () => {
    await triggerHealthCheckFn();
    toast.success("Health check completed");
    await load();
  };

  const handleBackup = async (type: "daily" | "weekly" | "monthly") => {
    setBackingUp(true);
    try {
      await triggerBackupFn({ data: { type } });
      toast.success(`${type} backup triggered`);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBackingUp(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/40 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Observability</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">System Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time system health, logs, alerts, and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleHealthCheck} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-medium hover:bg-accent cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Run Health Check
          </button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand text-brand-foreground px-4 py-2 text-sm font-semibold shadow-glow cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      {data && (
        <>
          {/* System Health */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-brand" /> System Health</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.health.checks.map((check: any) => (
                <div key={check.name} className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{check.name}</span>
                    <StatusBadge status={check.status} />
                  </div>
                  <p className="text-sm mt-1">
                    {check.status === "healthy" ? "Operational" : check.error || "Unreachable"}
                  </p>
                  {check.latency >= 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{check.latency}ms response</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last checked: {new Date(data.health.lastChecked).toLocaleTimeString()}</p>
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-brand" /> Overview (24h)</h2>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Users" value={data.stats.userCount} icon={Users} />
              <StatCard label="Errors" value={data.stats.errorCount} icon={Bug} sub="last 24h" />
              <StatCard label="Alerts" value={data.stats.alertCount} icon={Bell} />
              <StatCard label="Unacked Alerts" value={data.stats.unackedAlerts} icon={AlertTriangle} sub="pending" />
              <StatCard label="Security Events" value={data.stats.securityCount} icon={Shield} sub="last 24h" />
              <StatCard label="Version" value={data.version.version} icon={FileText} sub={`build ${data.version.build}`} />
            </div>
          </section>

          {/* Backups */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Database className="h-5 w-5 text-brand" /> Database Backups</h2>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as const).map(type => (
                  <button key={type} onClick={() => handleBackup(type)} disabled={backingUp}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 cursor-pointer">
                    <Download className="h-3.5 w-3.5" /> {type}
                  </button>
                ))}
              </div>
            </div>
            {data.latestBackup && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm mb-4">
                Latest: <span className="font-semibold">{data.latestBackup.backup_type}</span> backup —
                {data.latestBackup.file_size_bytes ? ` ${(data.latestBackup.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : " N/A"}
                <span className="text-muted-foreground ml-2">{new Date(data.latestBackup.started_at!).toLocaleString()}</span>
              </div>
            )}
            {data.backups.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Size</th><th className="p-3">Date</th>
                  </tr></thead>
                  <tbody>
                    {data.backups.map((b: any) => (
                      <tr key={b.id} className="border-b border-border/50 last:border-0">
                        <td className="p-3 font-medium capitalize">{b.backup_type}</td>
                        <td className="p-3"><StatusBadge status={b.status} /></td>
                        <td className="p-3 font-mono text-xs">{b.file_size_bytes ? `${(b.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "-"}</td>
                        <td className="p-3 text-muted-foreground">{new Date(b.started_at!).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No backups yet. Click daily/weekly/monthly to create one.</p>
            )}
          </section>

          {/* Recent Logs */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-brand" /> Recent System Logs</h2>
            <div className="overflow-x-auto rounded-2xl border border-border max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/30 sticky top-0">
                  <th className="p-3">Event</th><th className="p-3">Severity</th><th className="p-3">Description</th><th className="p-3">Time</th>
                </tr></thead>
                <tbody>
                  {data.logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="p-3"><span className="font-mono text-[10px] uppercase tracking-wider">{log.event_type}</span></td>
                      <td className="p-3"><StatusBadge status={log.severity} /></td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{log.description}</td>
                      <td className="p-3 text-muted-foreground text-[10px]">{new Date(log.created_at!).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-brand" /> Recent Alerts</h2>
            {data.alerts.length > 0 ? (
              <div className="space-y-2">
                {data.alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card/40 p-4">
                    <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      alert.severity === "critical" ? "bg-rose-500/10 text-rose-500" :
                      alert.severity === "warn" ? "bg-amber-500/10 text-amber-500" :
                      "bg-brand/10 text-brand"
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <StatusBadge status={alert.severity} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.created_at!).toLocaleString()}</p>
                    </div>
                    {!alert.acknowledged_at && (
                      <button onClick={async () => { await acknowledgeAlertFn({ data: { alertId: alert.id } }); await load(); }}
                        className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-accent cursor-pointer">
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-4 text-center">No alerts</p>}
          </section>

          {/* Security Events */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-brand" /> Security Events</h2>
            {data.securityEvents.length > 0 ? (
              <div className="space-y-2">
                {data.securityEvents.map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card/40 p-4">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm capitalize">{ev.event_type.replace(/_/g, " ")}</p>
                        <StatusBadge status={ev.severity} />
                        {!ev.resolved && <span className="text-[10px] text-amber-500 font-medium">Unresolved</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">IP: {ev.ip_address} · {new Date(ev.created_at!).toLocaleString()}</p>
                    </div>
                    {!ev.resolved && (
                      <button onClick={async () => { await resolveSecurityEventFn({ data: { eventId: ev.id } }); await load(); }}
                        className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 cursor-pointer">
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-4 text-center">No security events</p>}
          </section>

          {/* Test Alert */}
          <section className="text-center pt-4 pb-8">
            <button onClick={async () => { await sendTestAlertFn(); toast.success("Test alert sent"); }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-medium hover:bg-accent cursor-pointer">
              <Bell className="h-4 w-4" /> Send Test Alert
            </button>
          </section>
        </>
      )}
    </div>
  );
}
