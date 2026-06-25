import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Star, TrendingUp, Crown, Medal } from "lucide-react";
import { AI_TOOLS, CATEGORIES } from "@/lib/data/tools";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "AI Rankings — Optima" },
      { name: "description", content: "Live leaderboards of the best AI tools by category, updated daily." },
      { property: "og:title", content: "AI Rankings — Optima" },
      { property: "og:description", content: "Live leaderboards of the top AI tools by category." },
    ],
    links: [{ rel: "canonical", href: "/rankings" }],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const [cat, setCat] = useState<string>("All");
  const list = (cat === "All" ? AI_TOOLS : AI_TOOLS.filter((t) => t.category === cat))
    .slice()
    .sort((a, b) => b.score - a.score);
  const hasPodium = list.length >= 3;
  const podium = hasPodium ? list.slice(0, 3) : [];
  const rest = hasPodium ? list.slice(3) : list;
  const restStartIndex = hasPodium ? 4 : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Leaderboard</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">AI Rankings</h1>
        <p className="mt-3 text-muted-foreground">Updated every 24 hours from benchmarks, community votes, and real-world usage data.</p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${cat === c ? "border-brand bg-brand/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >{c}</button>
        ))}
      </div>

      {podium.length === 3 && (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((idx, pos) => {
            const t = podium[idx];
            const ranks = [
              { icon: Medal, label: "2nd", height: "h-48", grad: "from-[oklch(0.75_0.04_270)] to-[oklch(0.6_0.04_270)]" },
              { icon: Crown, label: "1st", height: "h-60", grad: "from-[oklch(0.72_0.2_295)] to-[oklch(0.78_0.18_340)]" },
              { icon: Medal, label: "3rd", height: "h-44", grad: "from-[oklch(0.7_0.12_60)] to-[oklch(0.55_0.12_40)]" },
            ][pos];
            return (
              <div key={t.name} className={`relative flex ${ranks.height} flex-col justify-end overflow-hidden rounded-3xl glass-strong p-6 ${pos === 1 ? "ring-brand" : ""}`}>
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ranks.grad} opacity-20`} />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-30" style={{ background: t.color }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br ${ranks.grad} px-2.5 py-1 text-xs font-medium text-brand-foreground shadow-glow`}>
                      <ranks.icon className="h-3 w-3" /> {ranks.label}
                    </span>
                    <span className="font-mono text-3xl font-bold tabular-nums">{t.score}</span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.vendor} · {t.category}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-brand transition-all duration-1000" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 overflow-hidden rounded-2xl glass">
        <div className="grid grid-cols-[40px_1fr_120px_100px_100px_140px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span>#</span><span>Tool</span><span className="hidden sm:block">Category</span><span>Price</span><span>Reviews</span><span>Score</span>
        </div>
        {rest.map((t, i) => (
          <div key={t.name} className="grid grid-cols-[40px_1fr_120px_100px_100px_140px] items-center gap-4 border-b border-border px-6 py-4 transition-colors last:border-0 hover:bg-accent/40">
            <span className="font-mono text-sm text-muted-foreground">{String(i + restStartIndex).padStart(2, "0")}</span>
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${t.color}30`, color: t.color }}>
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.vendor}</p>
              </div>
            </div>
            <span className="hidden sm:block text-sm text-muted-foreground">{t.category}</span>
            <span className="text-sm">{t.price}</span>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="tabular-nums">{(4 + Math.random()).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-brand" style={{ width: `${t.score}%` }} />
              </div>
              <span className="w-8 font-mono text-sm tabular-nums">{t.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
