import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Crown, Medal, RefreshCw, TrendingUp, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import { getLeaderboardFn } from "../lib/api/leaderboard.functions";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Optima" },
      { name: "description", content: "Top curators, popular stacks, and top referrers on Optima." },
    ],
  }),
  component: LeaderboardPage,
});

type Tab = "curators" | "stacks" | "referrals";

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "curators", label: "Top Curators", icon: Crown },
  { key: "stacks", label: "Popular Stacks", icon: Layers },
  { key: "referrals", label: "Top Referrers", icon: Users },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="font-mono text-sm text-muted-foreground w-5 text-center">{rank}</span>;
}

function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("curators");
  const [period, setPeriod] = useState<"monthly" | "all_time">("all_time");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getLeaderboardFn>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (t: Tab, p: "monthly" | "all_time") => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboardFn({ tab: t, period: p });
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab, period); }, [tab, period]);

  const activeTab = tabs.find((t) => t.key === tab);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <header className="text-center border-b border-border/40 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-amber-500 mb-4">
          <Trophy className="h-3.5 w-3.5" />
          {activeTab?.label || "Leaderboard"}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-brand bg-clip-text text-transparent">
          Community Leaderboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Top contributors, popular content, and growth champions
        </p>

        {/* Tab selector */}
        <div className="mt-6 inline-flex rounded-full border border-border p-1 flex-wrap justify-center">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  tab === t.key ? "bg-gradient-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Period toggle */}
        <div className="mt-4 inline-flex rounded-full border border-border p-0.5">
          {(["all_time", "monthly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                period === p ? "bg-gradient-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all_time" ? "All-Time" : "This Month"}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-rose-500 mb-2">Failed to load leaderboard</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={() => load(tab, period)} className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-glow cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : !data || data.leaders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No data yet. Be the first!</p>
          {tab === "curators" && (
            <Link to="/stack-builder" className="mt-4 inline-block text-brand hover:underline text-sm">
              Create your first stack →
            </Link>
          )}
          {tab === "stacks" && (
            <Link to="/stacks" className="mt-4 inline-block text-brand hover:underline text-sm">
              Browse stacks →
            </Link>
          )}
          {tab === "referrals" && (
            <Link to="/referrals" className="mt-4 inline-block text-brand hover:underline text-sm">
              Join the referral program →
            </Link>
          )}
        </div>
      ) : (
        <>
          {data.my_rank && (
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-center">
              Your rank: <span className="font-bold text-brand">#{data.my_rank}</span>
            </div>
          )}

          <div className="space-y-2">
            {data.leaders.map((leader: any) => (
              <div
                key={leader.userId || leader.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                  leader.rank <= 3 ? "border-brand/20 bg-card/80" : "border-border bg-card/40"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center shrink-0">
                  <RankIcon rank={leader.rank} />
                </div>

                {(tab === "curators" || tab === "referrals") && (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground overflow-hidden">
                    {leader.avatar?.startsWith("data:") ? (
                      <img src={leader.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (leader.name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {tab === "stacks" ? (
                    <>
                      <Link to="/stacks/$id" params={{ id: leader.id }} className="font-semibold truncate hover:text-brand transition-colors">
                        {leader.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>by {leader.creatorName}</span>
                        {leader.category && (
                          <span className="rounded-full border border-border/60 px-2 py-0.5">{leader.category}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold truncate">{leader.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {leader.sublabel || leader.label}
                      </p>
                    </>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-brand">{leader.score || leader.likes}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tab === "stacks" ? "likes" : tab === "curators" ? "stacks" : "referrals"}
                  </p>
                </div>

                {tab === "stacks" && (
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-mono text-sm text-muted-foreground">{leader.views}</p>
                    <p className="text-[10px] text-muted-foreground">views</p>
                  </div>
                )}

                {leader.rank <= 3 && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-500 border border-amber-500/30">
                    Top {leader.rank}
                  </span>
                )}
              </div>
            ))}
          </div>

          {tab === "referrals" && (
            <div className="text-center pt-4">
              <Link
                to="/referrals"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-glow"
              >
                <TrendingUp className="h-4 w-4" />
                Join the Referral Program
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
