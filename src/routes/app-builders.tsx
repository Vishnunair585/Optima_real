import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Star } from "lucide-react";

export const Route = createFileRoute("/app-builders")({
  head: () => ({
    meta: [
      { title: "AI App Builders — Optima" },
      { name: "description", content: "Compare Lovable, Bolt, Replit, v0, Cursor, Windsurf, Firebase Studio." },
      { property: "og:title", content: "AI App Builders — Optima" },
      { property: "og:description", content: "Compare the top AI app builders." },
    ],
    links: [{ rel: "canonical", href: "/app-builders" }],
  }),
  component: BuildersPage,
});

const BUILDERS = [
  { name: "Lovable", ease: 10, speed: 10, cost: 8, features: 9, rating: 4.9, color: "oklch(0.78 0.18 340)" },
  { name: "Bolt", ease: 9, speed: 9, cost: 8, features: 8, rating: 4.6, color: "oklch(0.82 0.16 80)" },
  { name: "v0", ease: 8, speed: 9, cost: 7, features: 8, rating: 4.5, color: "oklch(0.95 0.005 270)" },
  { name: "Cursor", ease: 8, speed: 9, cost: 8, features: 10, rating: 4.8, color: "oklch(0.85 0.15 80)" },
  { name: "Windsurf", ease: 8, speed: 9, cost: 9, features: 9, rating: 4.6, color: "oklch(0.74 0.16 195)" },
  { name: "Replit", ease: 9, speed: 8, cost: 7, features: 9, rating: 4.4, color: "oklch(0.78 0.16 40)" },
  { name: "Firebase Studio", ease: 7, speed: 8, cost: 9, features: 8, rating: 4.2, color: "oklch(0.82 0.16 60)" },
];

const METRICS: { key: keyof typeof BUILDERS[number]; label: string }[] = [
  { key: "ease", label: "Ease of Use" },
  { key: "speed", label: "Speed" },
  { key: "cost", label: "Cost" },
  { key: "features", label: "Features" },
];

function BuildersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">App Builders</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">AI App Builder Hub</h1>
        <p className="mt-3 text-muted-foreground">Lovable, Bolt, Replit, v0, Cursor, Windsurf — compared on what matters.</p>
      </header>

      <div className="mt-10 overflow-hidden rounded-2xl glass">
        <div className="grid items-center gap-4 border-b border-border px-6 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: "1.6fr repeat(4, 1fr) 100px" }}>
          <span>Tool</span>{METRICS.map((m) => <span key={m.key}>{m.label}</span>)}<span>Rating</span>
        </div>
        {BUILDERS.map((b) => (
          <div key={b.name} className="grid items-center gap-4 border-b border-border px-6 py-4 transition-colors last:border-0 hover:bg-accent/40" style={{ gridTemplateColumns: "1.6fr repeat(4, 1fr) 100px" }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: `${b.color}25`, color: b.color }}>
                <Wrench className="h-4 w-4" />
              </span>
              <span className="truncate font-medium">{b.name}</span>
            </div>
            {METRICS.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-brand" style={{ width: `${(b[m.key] as number) * 10}%` }} />
                </div>
                <span className="w-5 font-mono text-xs tabular-nums">{b[m.key] as number}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-mono">{b.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
