import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Star, ArrowUp, Zap, MessageSquare, Award, Flame } from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Hub — Optima" },
      { name: "description", content: "Explore shared AI stacks, read community reviews, and see the top contributors." },
      { property: "og:title", content: "Community Hub — Optima" },
      { property: "og:description", content: "Reviews, stacks, and leaderboards from 186,000+ members." },
    ],
    links: [{ rel: "canonical", href: "/community" }],
  }),
  component: () => (
    <ProtectedRoute>
      <CommunityPage />
    </ProtectedRoute>
  ),
});

const SHARED_STACKS = [
  {
    title: "SaaS Launchpad Stack",
    creator: "tech_founder",
    avatar: "TF",
    upvotes: 438,
    tools: [
      { name: "Lovable", desc: "Frontend builder", color: "oklch(0.78 0.18 340)" },
      { name: "Claude", desc: "Core API", color: "oklch(0.78 0.16 60)" },
      { name: "n8n", desc: "Workflow automation", color: "oklch(0.78 0.16 20)" }
    ]
  },
  {
    title: "Autonomous Agent Stack",
    creator: "automator_pro",
    avatar: "AP",
    upvotes: 295,
    tools: [
      { name: "CrewAI", desc: "Agent orchestration", color: "oklch(0.72 0.2 295)" },
      { name: "Gemini", desc: "High-context API", color: "oklch(0.74 0.18 220)" },
      { name: "ElevenLabs", desc: "Voice output", color: "oklch(0.74 0.18 220)" }
    ]
  },
  {
    title: "AI Research Engine",
    creator: "phd_candidate",
    avatar: "PC",
    upvotes: 188,
    tools: [
      { name: "Perplexity", desc: "Fact search", color: "oklch(0.78 0.14 195)" },
      { name: "ChatGPT", desc: "Synthesis & drafts", color: "oklch(0.78 0.16 155)" },
      { name: "Cursor", desc: "Code generation", color: "oklch(0.85 0.15 80)" }
    ]
  }
];

const REVIEWS = [
  {
    author: "dev_alice",
    avatar: "A",
    tool: "Cursor",
    rating: 5,
    date: "2 hours ago",
    content: "Cursor is a total game changer. The Composer feature has completely replaced VS Code for my day-to-day work. The context indexing is unmatched."
  },
  {
    author: "growth_hacker",
    avatar: "G",
    tool: "Lovable",
    rating: 5,
    date: "1 day ago",
    content: "Lovable built my landing page in 3 minutes. Literally saved me weeks of frontend design and integration work. Absolutely mindblowing speed."
  },
  {
    author: "content_designer",
    avatar: "C",
    tool: "Midjourney",
    rating: 4,
    date: "3 days ago",
    content: "Excellent quality and creative layouts. The v6 model is extremely accurate with text rendering now, though I wish the pricing was slightly cheaper."
  }
];

const CONTRIBUTORS = [
  { rank: "01", name: "alex_m", points: 2840, badges: ["Stack Master", "Verified Expert"], color: "oklch(0.72 0.2 295)" },
  { rank: "02", name: "sara_j", points: 1950, badges: ["Prompt Writer"], color: "oklch(0.78 0.16 60)" },
  { rank: "03", name: "lucas_k", points: 1420, badges: ["Reviewer Pro"], color: "oklch(0.74 0.18 220)" },
  { rank: "04", name: "elena_r", points: 980, badges: ["Contributor"], color: "oklch(0.78 0.16 155)" }
];

function CommunityPage() {
  const [upvotesState, setUpvotesState] = useState<Record<number, number>>({});
  const [hasUpvoted, setHasUpvoted] = useState<Record<number, boolean>>({});

  const handleUpvote = (idx: number, currentUpvotes: number) => {
    if (hasUpvoted[idx]) {
      setUpvotesState({ ...upvotesState, [idx]: currentUpvotes });
      setHasUpvoted({ ...hasUpvoted, [idx]: false });
    } else {
      setUpvotesState({ ...upvotesState, [idx]: currentUpvotes + 1 });
      setHasUpvoted({ ...hasUpvoted, [idx]: true });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Community Hub</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Optima Community</h1>
        <p className="mt-3 text-muted-foreground">
          Reviews, shared stacks, and leaderboards from our 186,000+ members. Find out what other builders are running.
        </p>
      </header>

      {/* Grid of Sections */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Shared Stacks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending Stacks
            </h2>
            <Link to="/stack-builder" className="text-xs font-semibold text-brand hover:underline">
              Create a stack
            </Link>
          </div>

          <div className="space-y-4">
            {SHARED_STACKS.map((stack, idx) => {
              const displayUpvotes = upvotesState[idx] ?? stack.upvotes;
              const isUpvoted = hasUpvoted[idx];
              return (
                <div key={idx} className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:bg-card/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{stack.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Shared by @{stack.creator}</p>
                    </div>
                    <button
                      onClick={() => handleUpvote(idx, stack.upvotes)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        isUpvoted
                          ? "border-brand bg-brand/15 text-brand"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      {displayUpvotes}
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {stack.tools.map((t) => (
                      <div key={t.name} className="rounded-xl border border-border bg-card/40 p-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contributor Leaderboard */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Contributors
          </h2>

          <div className="rounded-2xl glass p-6 space-y-4">
            {CONTRIBUTORS.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-4 p-2 rounded-xl transition-all hover:bg-accent/40">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-muted-foreground">{c.rank}</span>
                  <div className="grid h-8 w-8 place-items-center rounded-full shrink-0 font-bold uppercase text-xs" style={{ background: `${c.color}25`, color: c.color }}>
                    {c.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">@{c.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {c.badges.map((b) => (
                        <span key={b} className="text-[9px] font-mono border border-border px-1 py-0.2 rounded bg-card/60 text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold">{c.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <section className="mt-16 border-t border-border pt-12 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-brand" />
          Recent Verified Reviews
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r, idx) => (
            <div key={idx} className="rounded-2xl glass p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 font-bold text-xs uppercase text-brand">
                      {r.avatar}
                    </span>
                    <span className="text-xs font-semibold">@{r.author}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-md text-foreground">
                    {r.tool}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < r.rating ? "fill-warning text-warning" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{r.content}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
