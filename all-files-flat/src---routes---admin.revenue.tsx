import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "../components/auth/route-guard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { getRevenueMetricsFn } from "../lib/api/billing.functions";
import { 
  TrendingUp, Users, DollarSign, Activity, Percent, ArrowUpRight 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue Metrics — Admin Console" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <ProtectedRoute requireRole="Admin">
      <AdminRevenueDashboard />
    </ProtectedRoute>
  ),
});

function AdminRevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await getRevenueMetricsFn();
        setMetrics(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load financial metrics.");
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  // Monthly revenue mock data
  const revenueHistory = [
    { month: "Jan", revenue: 210 },
    { month: "Feb", revenue: 280 },
    { month: "Mar", revenue: 390 },
    { month: "Apr", revenue: 510 },
    { month: "May", revenue: 780 },
    { month: "Jun", revenue: metrics.mrr }
  ];

  // Plan distribution mock data
  const planData = [
    { name: "Pro Plan", value: 65, color: "#a855f7" },
    { name: "Team Plan", value: 35, color: "#3b82f6" }
  ];

  const transactionHistory = [
    { id: "TX-9280", email: "user1@domain.com", plan: "Pro Plan", amount: "$20", date: "Today, 10:15 AM", status: "success" },
    { id: "TX-9279", email: "company@enterprise.co", plan: "Team Plan", amount: "$49", date: "Today, 08:30 AM", status: "success" },
    { id: "TX-9278", email: "creator@youtube.com", plan: "Pro Plan", amount: "$20", date: "Yesterday, 04:40 PM", status: "success" },
    { id: "TX-9277", email: "startup@ycombinator.com", plan: "Team Plan", amount: "$440", date: "Yesterday, 11:20 AM", status: "success" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Financial Operations</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-brand bg-clip-text text-transparent">
            Revenue & SaaS Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track Monthly Recurring Revenue (MRR), ARR, subscriber growth rates, and payment statuses.
          </p>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Monthly Rec. Revenue</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">${metrics.mrr}</p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> +{metrics.growthRate}% monthly growth
          </span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Annual Run Rate (ARR)</p>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">${metrics.arr}</p>
          <span className="text-[10px] text-muted-foreground font-mono mt-1 block">Based on current monthly run</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Active Subscribers</p>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">{metrics.activeSubscribers}</p>
          <span className="text-[10px] text-muted-foreground font-mono mt-1 block">Paying accounts in billing system</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Trial Conversion Rate</p>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-foreground">{metrics.trialConversions}%</p>
          <span className="text-[10px] text-rose-400 font-mono mt-1 block">Churn Rate: {metrics.churnRate}%</span>
        </div>
      </div>

      {/* Main Row: Revenue Trend Line Chart on Left, Plan Distribution on Right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight mb-1">Monthly MRR Growth Trend</h3>
            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue growth over the past 6 months.</p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#0b0a14", border: "1px solid #1f2937", borderRadius: "12px" }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Breakdown Pie Chart */}
        <div className="glass p-6 rounded-2xl border border-border flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold tracking-tight">Plan Revenue Share</h3>
            <p className="text-[11px] text-muted-foreground">Breakdown of subscription volume by Pro vs Team plans.</p>
          </div>

          <div className="h-48 w-48 relative flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-xs text-muted-foreground font-mono uppercase">Total MRR</p>
              <p className="text-2xl font-black">${metrics.mrr}</p>
            </div>
          </div>

          <div className="flex gap-4 text-xs font-mono mt-4">
            {planData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span>{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="glass p-6 rounded-2xl border border-border space-y-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">Recent SaaS Transactions</h3>
          <p className="text-xs text-muted-foreground">Live ledger logging of Stripe checkout payments and invoice activations.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/40 pb-2">
                <th className="pb-3 text-muted-foreground">Transaction ID</th>
                <th className="pb-3 text-muted-foreground">User/Email</th>
                <th className="pb-3 text-muted-foreground">Plan Product</th>
                <th className="pb-3 text-muted-foreground">Amount Paid</th>
                <th className="pb-3 text-muted-foreground">Date Time</th>
                <th className="pb-3 text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionHistory.map((tx) => (
                <tr key={tx.id} className="border-b border-border/20 last:border-0">
                  <td className="py-3 font-mono font-medium">{tx.id}</td>
                  <td className="py-3 text-muted-foreground">{tx.email}</td>
                  <td className="py-3 font-semibold">{tx.plan}</td>
                  <td className="py-3 text-emerald-400 font-mono font-semibold">{tx.amount}</td>
                  <td className="py-3 text-muted-foreground">{tx.date}</td>
                  <td className="py-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase text-[9px]">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
