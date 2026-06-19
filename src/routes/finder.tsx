import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, DollarSign, Wand2 } from "lucide-react";
import { AI_TOOLS } from "@/lib/data/tools";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/finder")({
  head: () => ({
    meta: [
      { title: "AI Finder — Optima" },
      { name: "description", content: "Answer 4 questions and get a personalized AI stack recommendation." },
      { property: "og:title", content: "AI Finder — Optima" },
      { property: "og:description", content: "Personalized AI stack recommendations in seconds." },
    ],
    links: [{ rel: "canonical", href: "/finder" }],
  }),
  component: () => (
    <ProtectedRoute>
      <FinderPage />
    </ProtectedRoute>
  ),
});

const STEPS = [
  { key: "persona", label: "Who are you?", options: ["Student", "Developer", "Founder", "Designer", "Marketer", "Researcher"] },
  { key: "goal", label: "What's your goal?", options: ["Coding", "Research", "Writing", "AI Agents", "Website Building", "App Building", "Marketing", "Automation"] },
  { key: "budget", label: "Your budget?", options: ["Free", "Under $20", "Under $100", "Enterprise"] },
  { key: "experience", label: "Experience level", options: ["Beginner", "Intermediate", "Advanced"] },
] as const;

function FinderPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step >= STEPS.length;

  const recommended = useMemo(() => {
    const goal = answers.goal ?? "Coding";
    const pool = AI_TOOLS.filter((t) =>
      goal === "Coding" ? ["Coding", "AI App Builders"].includes(t.category) :
      goal === "App Building" ? t.category === "AI App Builders" :
      goal === "Research" ? ["Research", "Writing"].includes(t.category) :
      goal === "AI Agents" ? ["AI Agents", "Automation"].includes(t.category) :
      goal === "Automation" ? ["Automation", "AI Agents"].includes(t.category) :
      t.category === "Writing"
    );
    return pool.length ? pool : AI_TOOLS.slice(0, 4);
  }, [answers.goal]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">AI Finder</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Build your stack</h1>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < step ? "bg-gradient-brand" : i === step ? "bg-brand/60" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {!done ? (
        <div className="rounded-3xl glass-strong p-8 sm:p-10 animate-scale-in">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{STEPS[step].label}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS[step].options.map((opt) => {
              const selected = answers[STEPS[step].key] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [STEPS[step].key]: opt })}
                  className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${selected ? "border-brand bg-brand/10 ring-brand" : "border-border hover:bg-accent"}`}
                >
                  <span className="font-medium">{opt}</span>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${selected ? "border-brand bg-gradient-brand" : "border-border"}`}>
                    {selected && <Check className="h-3 w-3 text-brand-foreground" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-10 flex items-center justify-between">
            <button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={!answers[STEPS[step].key]}
              onClick={() => setStep(step + 1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-brand px-5 text-sm font-medium text-brand-foreground shadow-glow disabled:opacity-40"
            >
              {step === STEPS.length - 1 ? "Generate" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-up">
          <div className="rounded-3xl glass-strong p-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5 text-brand" /><span className="font-mono uppercase tracking-wider">Recommended stack · 98% match</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold">Your perfect AI stack</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Built for a <span className="text-foreground">{answers.persona}</span> focused on <span className="text-foreground">{answers.goal}</span>, budget <span className="text-foreground">{answers.budget}</span>.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {recommended.slice(0, 4).map((t, i) => (
                <div key={t.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-5 transition-all hover:-translate-y-0.5">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-40" style={{ background: t.color }} />
                  <div className="flex items-center justify-between">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {i === 0 && <span className="rounded-full border border-brand/40 bg-brand/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">Best pick</span>}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.vendor} · {t.category}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Score</span>
                    <span className="font-mono text-sm">{t.score}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-brand" style={{ width: `${t.score}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Expected monthly cost</p>
                <p className="mt-1 flex items-center gap-1 font-display text-2xl font-bold"><DollarSign className="h-5 w-5 text-success" />42<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Best alternative</p>
                <p className="mt-1 font-medium">{recommended[1]?.name ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Setup time</p>
                <p className="mt-1 font-medium">~15 minutes</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => { setStep(0); setAnswers({}); }} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-accent">Start over</button>
              <Link to="/stack-builder" className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-medium text-brand-foreground shadow-glow">
                Build full workflow <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
