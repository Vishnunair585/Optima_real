import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, DollarSign } from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "AI Cost Calculator — Optima" },
      { name: "description", content: "Estimate monthly AI spend across OpenAI, Anthropic, Google, and more." },
      { property: "og:title", content: "AI Cost Calculator — Optima" },
      { property: "og:description", content: "Estimate monthly AI spend across providers." },
    ],
    links: [{ rel: "canonical", href: "/calculator" }],
  }),
  component: () => (
    <ProtectedRoute>
      <CalcPage />
    </ProtectedRoute>
  ),
});

const PROVIDERS = [
  { name: "OpenAI · GPT-4o", input: 2.5, output: 10, color: "oklch(0.78 0.16 155)" },
  { name: "Anthropic · Claude Sonnet", input: 3, output: 15, color: "oklch(0.78 0.16 60)" },
  { name: "Google · Gemini 1.5 Pro", input: 1.25, output: 5, color: "oklch(0.74 0.18 220)" },
  { name: "OpenAI · GPT-4o mini", input: 0.15, output: 0.6, color: "oklch(0.78 0.16 155)" },
  { name: "Anthropic · Claude Haiku", input: 0.25, output: 1.25, color: "oklch(0.78 0.16 60)" },
  { name: "Google · Gemini Flash", input: 0.075, output: 0.3, color: "oklch(0.74 0.18 220)" },
];

function CalcPage() {
  const [requests, setRequests] = useState(10000);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);

  const costs = PROVIDERS.map((p) => ({
    ...p,
    monthly: ((requests * inputTokens * p.input) / 1_000_000) + ((requests * outputTokens * p.output) / 1_000_000),
  })).sort((a, b) => a.monthly - b.monthly);

  const max = Math.max(...costs.map((c) => c.monthly));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Cost Calculator</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Estimate your spend</h1>
        <p className="mt-3 text-muted-foreground">Adjust the sliders. Get monthly costs across leading LLM providers.</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6 rounded-2xl glass p-6">
          <Field label="Requests per month" value={requests} min={1000} max={1_000_000} step={1000} onChange={setRequests} format={(v) => v.toLocaleString()} />
          <Field label="Input tokens per request" value={inputTokens} min={100} max={20000} step={100} onChange={setInputTokens} format={(v) => v.toLocaleString()} />
          <Field label="Output tokens per request" value={outputTokens} min={100} max={20000} step={100} onChange={setOutputTokens} format={(v) => v.toLocaleString()} />
        </div>

        <div className="rounded-2xl glass">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display font-semibold">Monthly cost by provider</h3>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {costs.map((c, i) => (
              <div key={c.name} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="truncate font-medium">{c.name}</span>
                    {i === 0 && <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">Cheapest</span>}
                  </div>
                  <span className="flex items-center gap-0.5 font-mono text-sm tabular-nums">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />{c.monthly.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full transition-all duration-500" style={{ width: `${(c.monthly / max) * 100}%`, background: `linear-gradient(90deg, ${c.color}, oklch(0.72 0.2 295))` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-mono text-sm text-brand">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-3 w-full accent-[oklch(0.72_0.2_295)]" />
    </div>
  );
}
