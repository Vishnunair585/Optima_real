import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agent Hub — Optima" },
      { name: "description", content: "Discover and compare the best AI agent-building platforms." },
      { property: "og:title", content: "AI Agent Hub — Optima" },
      { property: "og:description", content: "Best agent platforms, ranked." },
    ],
    links: [{ rel: "canonical", href: "/agents" }],
  }),
  component: AgentsPage,
});

const CATS = ["Customer Support", "Research", "Coding", "Automation", "Sales", "Marketing"];
const AGENTS = [
  { name: "CrewAI", cat: "Automation", desc: "Multi-agent collaboration framework.", score: 94, color: "oklch(0.72 0.2 295)" },
  { name: "LangChain", cat: "Coding", desc: "The most extensible agent toolkit.", score: 92, color: "oklch(0.78 0.16 155)" },
  { name: "AutoGen", cat: "Research", desc: "Microsoft's multi-agent conversation engine.", score: 90, color: "oklch(0.74 0.18 220)" },
  { name: "Vapi", cat: "Customer Support", desc: "Voice agents in minutes.", score: 89, color: "oklch(0.78 0.18 340)" },
  { name: "Relevance AI", cat: "Sales", desc: "Build AI workforce, no code.", score: 88, color: "oklch(0.82 0.16 80)" },
  { name: "n8n", cat: "Automation", desc: "Self-hosted automation with AI nodes.", score: 90, color: "oklch(0.78 0.16 20)" },
  { name: "Lindy", cat: "Marketing", desc: "Personal AI employees for ops.", score: 86, color: "oklch(0.74 0.16 195)" },
  { name: "Cognosys", cat: "Research", desc: "Autonomous research agents.", score: 85, color: "oklch(0.72 0.2 295)" },
];

function AgentsPage() {
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? AGENTS : AGENTS.filter((a) => a.cat === cat);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Agent Hub</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Build with agents</h1>
        <p className="mt-3 text-muted-foreground">Every serious agent-building platform, ranked and categorized.</p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {["All", ...CATS].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${cat === c ? "border-brand bg-brand/15" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >{c}</button>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <div key={a.name} className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-30" style={{ background: a.color }} />
            <div className="relative flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${a.color}25`, color: a.color }}>
                <Bot className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{a.cat}</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{a.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-mono">{a.score}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
