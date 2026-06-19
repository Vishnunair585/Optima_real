import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Trophy, GitCompare, Layers, Bot, Calculator, BookOpen, Users, Zap, Star, TrendingUp, ChevronRight, Check } from "lucide-react";
import { AI_TOOLS } from "@/lib/data/tools";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Optima — Find the Perfect AI Tool in Seconds" },
      { name: "description", content: "The AI Decision Engine. Compare AI models, build AI stacks, and discover the right AI tools for your goal." },
      { property: "og:title", content: "Optima — The AI Decision Engine" },
      { property: "og:description", content: "Compare AI models, build AI stacks, and find the perfect tool for your goal." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const STATS = [
  { value: "2,847", label: "AI Tools Ranked", sub: "+124 this week" },
  { value: "42", label: "AI Categories", sub: "Curated taxonomy" },
  { value: "186K", label: "Community Reviews", sub: "Verified users" },
  { value: "1.2M", label: "Comparisons / mo", sub: "Decisions made" },
];

const FEATURES = [
  { icon: Sparkles, title: "AI Finder", desc: "Answer 4 questions and get a tailored AI stack — picked by data, not hype.", to: "/finder", accent: "from-[oklch(0.72_0.2_295)] to-[oklch(0.78_0.18_340)]" },
  { icon: Trophy, title: "Live Rankings", desc: "Real-time leaderboards across coding, writing, agents, and more.", to: "/rankings", accent: "from-[oklch(0.82_0.16_80)] to-[oklch(0.78_0.16_40)]" },
  { icon: GitCompare, title: "Side-by-Side Compare", desc: "Radar charts, benchmarks, pros, cons. Decide in 30 seconds.", to: "/compare", accent: "from-[oklch(0.74_0.18_220)] to-[oklch(0.72_0.2_295)]" },
  { icon: Layers, title: "Stack Builder", desc: "Generate a complete workflow — frontend to deployment to marketing.", to: "/stack-builder", accent: "from-[oklch(0.78_0.16_155)] to-[oklch(0.74_0.18_195)]" },
  { icon: Bot, title: "Agent Hub", desc: "Discover the best agent-building platforms for your use case.", to: "/agents", accent: "from-[oklch(0.72_0.2_295)] to-[oklch(0.74_0.18_220)]" },
  { icon: Calculator, title: "Cost Calculator", desc: "Estimate monthly spend across providers before you commit.", to: "/calculator", accent: "from-[oklch(0.78_0.18_340)] to-[oklch(0.82_0.16_80)]" },
  { icon: BookOpen, title: "Prompt Library", desc: "Thousands of curated prompts. Copy, save, remix.", to: "/prompts", accent: "from-[oklch(0.74_0.18_195)] to-[oklch(0.78_0.16_155)]" },
  { icon: Users, title: "Community", desc: "Reviews, shared stacks, contributor leaderboard.", to: "/community", accent: "from-[oklch(0.82_0.16_60)] to-[oklch(0.78_0.18_340)]" },
];

const PERSONAS = ["Student", "Developer", "Founder", "Designer", "Marketer", "Researcher"];
const GOALS = ["Coding", "Research", "Writing", "AI Agents", "Website", "App", "Marketing", "Automation"];

function Landing() {
  return (
    <>
      <Hero />
      <Marquee />
      <Stats />
      <FeatureGrid />
      <RankingPreview />
      <CTA />
    </>
  );
}

const PERSONA_MATCH_SCORES: Record<string, number> = {
  Student: 95,
  Developer: 98,
  Founder: 96,
  Designer: 94,
  Marketer: 93,
  Researcher: 97,
};

function Hero() {
  const [persona, setPersona] = useState("Developer");
  const [goal, setGoal] = useState("Coding");

  const recommendedTools = useMemo(() => {
    let pool = AI_TOOLS;
    if (goal === "Coding") {
      pool = AI_TOOLS.filter((t) => ["Coding", "App Builder"].includes(t.category));
    } else if (goal === "Research") {
      pool = AI_TOOLS.filter((t) => ["Research", "Chat"].includes(t.category));
    } else if (goal === "Writing") {
      pool = AI_TOOLS.filter((t) => ["Chat"].includes(t.category));
    } else if (goal === "AI Agents") {
      pool = AI_TOOLS.filter((t) => ["Agents", "Automation"].includes(t.category));
    } else if (goal === "Website" || goal === "App") {
      pool = AI_TOOLS.filter((t) => ["App Builder"].includes(t.category));
    } else if (goal === "Automation") {
      pool = AI_TOOLS.filter((t) => ["Automation", "Agents"].includes(t.category));
    } else if (goal === "Marketing") {
      pool = AI_TOOLS.filter((t) => ["Image", "Video", "Chat"].includes(t.category));
    }
    const sorted = [...pool].sort((a, b) => b.score - a.score);
    return sorted.length ? sorted.slice(0, 3) : AI_TOOLS.slice(0, 3);
  }, [goal]);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="mx-auto flex justify-center mb-6">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-card border border-border shadow-glow animate-float-slow">
              <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10">
                <defs>
                  <linearGradient id="hero-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path 
                  d="M6 18 L14 26 L26 14 L18 6 Z" 
                  stroke="url(#hero-logo-grad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M12 20 L24 8 M24 8 H16 M24 8 V16" 
                  stroke="url(#hero-logo-grad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs">
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-success animate-pulse-glow" />
            <span className="text-muted-foreground">New · GPT-5 and Claude 4 added to rankings</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Find the <span className="text-gradient">Perfect AI Tool</span>
            <br />in Seconds
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Compare AI models, build AI stacks, discover agents, and make smarter decisions
            with data-driven recommendations across 2,800+ tools.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/finder" className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-medium text-brand-foreground shadow-glow transition-transform hover:scale-[1.02]">
              Find My AI Stack
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/rankings" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/40 px-6 text-sm font-medium glass hover:bg-card/60">
              Explore Rankings
            </Link>
          </div>
        </div>

        {/* Interactive AI Finder preview */}
        <div className="mx-auto mt-16 max-w-4xl animate-scale-in">
          <div className="relative rounded-3xl glass-strong shadow-elegant p-2">
            <div className="absolute -inset-px rounded-3xl bg-gradient-brand opacity-20 blur-xl" />
            <div className="relative rounded-[22px] bg-card/80 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <svg viewBox="0 0 32 32" fill="none" className="h-4.5 w-4.5">
                    <defs>
                      <linearGradient id="mini-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path d="M6 18 L14 26 L26 14 L18 6 Z" stroke="url(#mini-logo-grad)" strokeWidth="3" />
                    <path d="M12 20 L24 8 M24 8 H16 M24 8 V16" stroke="url(#mini-logo-grad)" strokeWidth="3" />
                  </svg>
                  <span className="font-mono uppercase tracking-wider">AI Finder · Live Preview</span>
                </div>
                <div className="hidden gap-1 sm:flex">
                  {[1, 2, 3, 4].map((s) => (
                    <span key={s} className={`h-1.5 w-6 rounded-full ${s <= 2 ? "bg-gradient-brand" : "bg-muted"}`} />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground">Who are you?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PERSONAS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${persona === p ? "border-brand bg-brand/15 text-foreground ring-brand" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    >{p}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground">What's your goal?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${goal === g ? "border-brand bg-brand/15 text-foreground ring-brand" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    >{g}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-wider">Recommended for {persona.toLowerCase()}s · {goal.toLowerCase()}</span>
                  <span className="text-brand">{PERSONA_MATCH_SCORES[persona] ?? 98}% match</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {recommendedTools.map((t) => (
                    <div key={t.name} className="rounded-xl border border-border bg-card/60 p-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                        <span className="text-sm font-medium">{t.name}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.category}</span>
                        <span className="font-mono">{t.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/finder" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  Open full AI Finder <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const row = [...AI_TOOLS, ...AI_TOOLS];
  return (
    <section className="relative border-y border-border py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
      <div className="flex overflow-hidden">
        <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
          {row.map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-sm whitespace-nowrap">
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">· {t.category}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.label} className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:bg-card/60" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
            <p className="font-display text-4xl font-bold text-gradient-soft">{s.value}</p>
            <p className="mt-2 text-sm font-medium">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Everything you need</p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          One platform.<br />
          <span className="text-gradient-soft">Every AI decision.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          From discovery to comparison to deployment — the toolkit serious AI users rely on.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Link
            key={f.title}
            to={f.to}
            className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:bg-card/60"
          >
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
            <div className={`relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${f.accent} shadow-glow`}>
              <f.icon className="h-5 w-5 text-brand-foreground" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
              Explore <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RankingPreview() {
  const top = [...AI_TOOLS].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Live leaderboard</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">This week's top AI tools</h2>
        </div>
        <Link to="/rankings" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-accent">
          View full rankings <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl glass">
        <div className="grid grid-cols-[40px_1fr_120px_100px_140px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span>#</span><span>Tool</span><span>Category</span><span>Price</span><span>Score</span>
        </div>
        {top.map((t, i) => (
          <div key={t.name} className="grid grid-cols-[40px_1fr_120px_100px_140px] items-center gap-4 border-b border-border px-6 py-4 transition-colors last:border-0 hover:bg-accent/40">
            <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg shrink-0" style={{ background: `${t.color}30`, color: t.color }}>
                <Zap className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.vendor}</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{t.category}</span>
            <span className="text-sm">{t.price}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-brand" style={{ width: `${t.score}%` }} />
              </div>
              <span className="w-8 font-mono text-sm tabular-nums">{t.score}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 sm:p-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[oklch(0.74_0.18_220)]/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Stop guessing.<br />
            <span className="text-gradient">Start ranking.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join 186,000+ builders, founders, and researchers using Optima to pick the right tool every time.
          </p>
          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            {["Personalized recommendations", "Real benchmark data", "Live community reviews", "Free forever for core features"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{f}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/finder" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-medium text-brand-foreground shadow-glow">
              Find My AI Stack <Sparkles className="h-4 w-4" />
            </Link>
            <Link to="/compare" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent">
              Compare Models <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
