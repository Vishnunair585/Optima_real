import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Bookmark, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library — Optima" },
      { name: "description", content: "Curated, copy-ready prompts for coding, research, marketing, content, business, and productivity." },
      { property: "og:title", content: "Prompt Library — Optima" },
      { property: "og:description", content: "Curated AI prompts for every use case." },
    ],
    links: [{ rel: "canonical", href: "/prompts" }],
  }),
  component: () => (
    <ProtectedRoute>
      <PromptsPage />
    </ProtectedRoute>
  ),
});

const CATS = ["Coding", "Research", "Marketing", "Content", "Business", "Productivity"];

const PROMPTS = [
  { cat: "Coding", title: "Refactor with tests", body: "You are an expert software engineer and code architect. Analyze the provided codebase snippet and refactor it focusing on:\n1. Performance optimization (O(n) complexity, memory footprint).\n2. Readability, modularity, and clean code principles (SOLID, DRY).\n3. Documentation: Add complete, valid JSDoc/TSDoc blocks including parameter types, exceptions, and return descriptions.\nOnce refactored, generate a comprehensive suite of unit tests using Vitest. The tests must cover:\n- Core happy path scenarios\n- Edge cases (null, undefined, boundary values, empty collections)\n- Expected error conditions and exception throwing.\n\nTarget Code:\n```\n{code}\n```" },
  { cat: "Coding", title: "Bug detective", body: "You are a Senior Principal Security and Reliability Engineer. Audit the following code for syntax errors, logical bugs, security vulnerabilities (OWASP Top 10), performance bottlenecks, and resource leaks (unclosed streams, event listeners).\nPerform your analysis line by line and structure your output in a markdown table with these exact columns:\n| Line Range | Severity (Low/Medium/High) | Identified Issue & Impact | Concrete Code Fix |\n\nSource Code:\n```\n{code}\n```" },
  { cat: "Research", title: "Source-cited summary", body: "You are an elite research analyst. Perform a deep summary on the topic: '{topic}' based on established literature and verified facts.\nStructure your summary into 5 key insights. Each insight must follow this format:\n- **[Core Concept/Key Insight]**: A detailed, 2-3 sentence analysis of the data.\n- *Primary Sources & Verification*: Cite the specific authoritative institutions, papers, or database URLs validating this insight.\nAvoid generalities, buzzwords, or unverified claims. Tone should be dry, objective, and authoritative." },
  { cat: "Research", title: "Steelman both sides", body: "Act as an unbiased philosophical analyst. Your task is to steelman the two opposing view-points on the topic: '{topic}'.\n1. **Steelman Argument A (In Favor)**: Construct the strongest, most compelling version of the argument in favor, utilizing primary logic, data, and assumptions.\n2. **Steelman Argument B (Opposed)**: Construct the strongest, most compelling version of the argument against, avoiding low-hanging fruit and strawman arguments.\n3. **Evidence Synthesis**: Evaluate both positions based on the quantity and quality of empirical evidence, statistical significance, and logical consistency. Conclude with a rigorous summary of which side holds more empirical weight." },
  { cat: "Marketing", title: "Landing page hero", body: "You are an elite conversion rate copywriter specializing in high-growth SaaS landing pages.\nFor the product: '{product}', craft 5 hero headline and subheadline pairs.\nEach pair must leverage a specific copywriting framework:\n- Framework 1: Benefit-Driven (Value-first)\n- Framework 2: Pain-Point Hook (Agitate & Solve)\n- Framework 3: Social Proof / Authority (Aspirational)\n- Framework 4: How-it-Works (Mechanism-based)\n- Framework 5: Fear Of Missing Out / Urgency\nGuidelines: Keep headlines under 8 words, focus on a high-value outcome, and ensure subheadlines provide a call to value." },
  { cat: "Marketing", title: "Cold email v2", body: "You are a B2B SaaS cold outbound expert. Write a highly personalized, conversion-optimized cold email to: '{persona}' pitching the offer: '{offer}'.\nRules:\n1. **Length**: Strict maximum of 90 words.\n2. **Subject Line**: 3-4 words, casual, lowercase, intriguing.\n3. **Opening**: Start directly with a specific, observed problem/data point relevant to the persona's industry (no fake compliments or pleasantries).\n4. **Value Prop**: Clearly state the unique mechanism of the offer and the expected ROI.\n5. **Call to Action (CTA)**: Use a low-friction, interest-based CTA (e.g., 'Are you open to checking a 2-min demo video on this next Tuesday?')." },
  { cat: "Content", title: "Blog outline", body: "You are an expert SEO Content Strategist. Develop a comprehensive, search-intent optimized outline for a 1,500-word blog post on the topic: '{topic}'.\nStructure the outline with:\n- **Title Tag & Meta Description**: Character-optimized (Title < 60, Meta < 155 chars) with target keywords.\n- **H2 & H3 Hierarchy**: Logical structure matching user search intent.\n- **Content Direction**: For each heading, outline:\n  - Specific search intent addressed.\n  - Key stats, data points, or graphs to find and embed.\n  - 3 logical internal link anchors and targets.\n  - Primary external source types to cite." },
  { cat: "Content", title: "Twitter thread", body: "You are a viral content marketer. Deconstruct the content from '{article-url}' and convert it into a highly engaging, 7-tweet educational thread.\nFramework:\n- **Tweet 1 (The Hook)**: Stat-driven, contrarian, or high-curiosity statement. Must make the reader click 'Show more'.\n- **Tweets 2-6 (Body)**: One clear, actionable insight per tweet. Use whitespace, simple language, and bullet points. Avoid filler words.\n- **Tweet 7 (Outro)**: Ask a thought-provoking question or provide a single call-to-action." },
  { cat: "Business", title: "Pricing memo", body: "You are a product management and monetization consultant.\nAnalyze the pricing strategies for the product: '{product}'.\nCompare 3 distinct pricing models:\n1. Per-Seat (Flat/User-based)\n2. Usage-based (Consumption-based)\n3. Value-based / Tiered Hybrid\nFor each model, provide a structured analysis including:\n- Core mechanics and billing triggers.\n- Major advantages and risk vectors.\n- Target Ideal Customer Profile (ICP).\n- Net revenue impact evaluation." },
  { cat: "Business", title: "Investor update", body: "You are a startup founder drafting the monthly investor update for '{company}'.\nStructure the update under these exact headings:\n1. **Summary Metrics**: MoM Revenue growth, Burn rate, Runway.\n2. **Key Wins & Milestones**: Major closed deals, product features shipped.\n3. **Hard Truths & Bottlenecks**: Open issues, lost deals, critical blockers.\n4. **The Ask**: 2 specific areas where investors can help (introductions, hiring).\nKeep the tone confident, radically transparent, and concise." },
  { cat: "Productivity", title: "Weekly review", body: "Act as an executive performance coach. Guide me through a 15-minute weekly retrospective.\nYou must:\n- Ask exactly one diagnostic question at a time.\n- Wait for my text input before asking the next question.\nThe evaluation must cover:\n1. Critical review of last week's top 3 priorities vs actual outcomes.\n2. Energy leak analysis (what drained time without returning value).\n3. Calibration of next week's absolute focus area (the 'One Thing')." },
  { cat: "Productivity", title: "Meeting → action items", body: "You are an executive assistant. Parse the provided meeting transcript and extract the raw details into a clear project management summary.\nOutput structure:\n- **Executive Decisions Made**: Bullets outlining final agreements.\n- **Action Items Table**:\n  | Action Item | Assigned Owner | Due Date | Estimated Effort (Low/Med/High) |\n- **Open Issues & Risks**: Dependencies or blockers requiring follow-up.\n- **Next Meeting Agenda**: Suggested key points for the next sync.\n\nTranscript:\n```\n{transcript}\n```" },
];

function PromptsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("saved_prompts") ?? "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const list = PROMPTS.filter((p) =>
    (cat === "All" || p.cat === cat) &&
    (q === "" || p.title.toLowerCase().includes(q.toLowerCase()) || p.body.toLowerCase().includes(q.toLowerCase()))
  );

  const handleCopy = (text: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success("Prompt copied to clipboard!"))
        .catch(() => {
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      toast.success("Prompt copied to clipboard!");
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
    document.body.removeChild(el);
  };

  const handleSave = (title: string) => {
    let updated: string[];
    if (saved.includes(title)) {
      updated = saved.filter((t) => t !== title);
      toast.success("Removed from saved prompts.");
    } else {
      updated = [...saved, title];
      toast.success("Prompt saved successfully!");
    }
    setSaved(updated);
    localStorage.setItem("saved_prompts", JSON.stringify(updated));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Prompt Library</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Prompts that actually work</h1>
        <p className="mt-3 text-muted-foreground">Curated by power users. Copy, remix, save.</p>
      </header>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts..."
            className="h-11 w-full rounded-full border border-border bg-card/40 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["All", ...CATS].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${cat === c ? "border-brand bg-brand/15" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >{c}</button>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {list.map((p, i) => (
          <div key={i} className="group rounded-2xl glass p-6 transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-brand" /> {p.cat}
              </span>
              <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => handleCopy(p.body)} 
                  className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground" 
                  aria-label="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => handleSave(p.title)} 
                  className={`grid h-7 w-7 place-items-center rounded-full border transition-all ${saved.includes(p.title) ? "border-brand bg-brand/15 text-brand" : "border-border text-muted-foreground hover:text-foreground"}`} 
                  aria-label="Save"
                >
                  <Bookmark className={`h-3.5 w-3.5 ${saved.includes(p.title) ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
            <pre className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 font-mono text-xs text-muted-foreground">{p.body}</pre>
          </div>
        ))}
        {list.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No prompts match. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}
