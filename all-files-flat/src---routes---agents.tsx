import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Star, ArrowRight, Search, ExternalLink } from "lucide-react";
import { AGENT_CATEGORIES, AI_AGENTS, AGENT_COUNT } from "../lib/data/agents";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agent Hub — Optima" },
      { name: "description", content: `Discover and compare ${AGENT_COUNT}+ AI agents across customer support, research, coding, sales, and more.` },
      { property: "og:title", content: "AI Agent Hub — Optima" },
      { property: "og:description", content: "The Wikipedia of AI agents — every major platform, categorized and ranked." },
    ],
    links: [{ rel: "canonical", href: "/agents" }],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return AI_AGENTS.filter((a) => {
      const matchesCat = cat === "All" || a.cat === cat;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.cat.toLowerCase().includes(q) ||
        (a.vendor?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesQuery;
    });
  }, [cat, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Agent Hub</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          The Wikipedia of AI Agents
        </h1>
        <p className="mt-3 text-muted-foreground">
          Explore {AGENT_COUNT}+ AI agents across every domain — customer support, research, coding,
          sales, healthcare, finance, and more. Find the right agent for any workflow.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents, vendors, or use cases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card/40 focus:border-brand outline-none text-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground font-mono">
          {list.length} agent{list.length !== 1 ? "s" : ""} shown
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["All", ...AGENT_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${
              cat === c
                ? "border-brand bg-brand/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <div
              key={a.name}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1"
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-30"
                style={{ background: a.color }}
              />
              <div className="relative flex items-center justify-between">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: `${a.color}25`, color: a.color }}
                >
                  <Bot className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {a.cat}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{a.name}</h3>
              {a.vendor && (
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{a.vendor}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-mono">{a.score}</span>
                  </div>
                  {a.pricing && (
                    <span className="text-[10px] font-mono text-emerald-400">{a.pricing}</span>
                  )}
                </div>
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No agents match your search</p>
          <p className="text-sm mt-1">Try a different category or search term.</p>
        </div>
      )}
    </div>
  );
}
