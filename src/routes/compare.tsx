import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import {
  Plus, X, Check, AlertCircle, Search, Star, Trophy,
  Wallet, GraduationCap, Briefcase, Share2, Download,
  Bookmark, ExternalLink, Zap, Users, Smartphone, Headphones,
  Code, Puzzle, Shield, Gauge, BookOpen, Sparkles,
  ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { AI_TOOLS, CATEGORIES, COMPARE_METRICS, COMPARE_DATA } from "@/lib/data/tools";
import { useAuth } from "../hooks/use-auth";
import { toast } from "sonner";

import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "AI Tool Comparison Engine — Optima" },
      { name: "description", content: "Compare top AI tools side-by-side: pricing, capabilities, features, pros, cons. Make data-driven decisions." },
      { property: "og:title", content: "AI Tool Comparison — Optima" },
      { property: "og:description", content: "Compare up to 4 AI tools side by side with detailed feature breakdowns." },
    ],
    links: [{ rel: "canonical", href: "/compare" }],
  }),
  component: () => (
    <ProtectedRoute>
      <ComparePage />
    </ProtectedRoute>
  ),
});

// ─── Tool metadata for advanced comparison ───
interface ToolMeta {
  description: string;
  pricingModel: string;
  startingPrice: string;
  freePlan: boolean;
  freeTrial: boolean;
  rating: number;
  reviewCount: number;
  verified: boolean;
  website: string;
  bestFor: string;
  easeOfUse: number;
  learningCurve: string;
  customerSupport: string;
  apiAvailable: boolean;
  integrations: number;
  customization: string;
  teamCollab: boolean;
  enterpriseSupport: boolean;
  mobileApp: boolean;
  features: string[];
  pros: string[];
  cons: string[];
  summary: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  ChatGPT: {
    description: "Versatile AI assistant for writing, coding, analysis, and creative tasks with the largest ecosystem.",
    pricingModel: "Freemium", startingPrice: "$20/mo", freePlan: true, freeTrial: false,
    rating: 4.7, reviewCount: 48200, verified: true, website: "https://chat.openai.com",
    bestFor: "General-purpose AI tasks, writing, brainstorming",
    easeOfUse: 10, learningCurve: "Very Easy", customerSupport: "Help Center + Email",
    apiAvailable: true, integrations: 500, customization: "High (GPTs, plugins)",
    teamCollab: true, enterpriseSupport: true, mobileApp: true,
    features: ["GPT-4o & GPT-4.1", "Image generation (DALL·E)", "Code interpreter", "Custom GPTs", "Web browsing", "File analysis", "Voice mode"],
    pros: ["Largest AI ecosystem", "Excellent for creative writing", "Regular model updates", "Strong plugin marketplace"],
    cons: ["Can hallucinate facts", "Context limits on free tier", "Slower on complex reasoning vs Claude"],
    summary: "ChatGPT offers the largest ecosystem with plugins, GPTs, and multimodal capabilities.",
  },
  Claude: {
    description: "Advanced AI model excelling at long-form reasoning, coding, and nuanced analysis.",
    pricingModel: "Freemium", startingPrice: "$20/mo", freePlan: true, freeTrial: false,
    rating: 4.8, reviewCount: 32100, verified: true, website: "https://claude.ai",
    bestFor: "Long-form reasoning, code review, document analysis",
    easeOfUse: 9, learningCurve: "Easy", customerSupport: "Help Center + Priority",
    apiAvailable: true, integrations: 200, customization: "Medium (Projects, system prompts)",
    teamCollab: true, enterpriseSupport: true, mobileApp: true,
    features: ["Claude 4 Opus/Sonnet", "200K context window", "Artifacts & Projects", "Code analysis", "PDF/Image understanding", "System prompts"],
    pros: ["Best-in-class reasoning", "Massive 200K context", "Excellent code generation", "Strong safety guardrails"],
    cons: ["Smaller plugin ecosystem", "No image generation", "Rate limits on free tier"],
    summary: "Claude is best for long-form reasoning and complex code analysis with its massive context window.",
  },
  Gemini: {
    description: "Google's multimodal AI deeply integrated with Google Workspace and search.",
    pricingModel: "Freemium", startingPrice: "$20/mo", freePlan: true, freeTrial: true,
    rating: 4.5, reviewCount: 28500, verified: true, website: "https://gemini.google.com",
    bestFor: "Google Workspace integration, multimodal tasks",
    easeOfUse: 9, learningCurve: "Easy", customerSupport: "Google Support",
    apiAvailable: true, integrations: 350, customization: "Medium (Gems, extensions)",
    teamCollab: true, enterpriseSupport: true, mobileApp: true,
    features: ["Gemini 2.5 Pro/Flash", "1M token context", "Google Workspace integration", "Image understanding", "Code generation", "Deep Research"],
    pros: ["Deep Google integration", "Massive context window", "Fast response times", "Free tier is generous"],
    cons: ["Creative writing can feel generic", "Fewer third-party integrations", "Occasional factual errors"],
    summary: "Gemini integrates deeply with Google Workspace and offers the largest context window.",
  },
  Perplexity: {
    description: "AI-powered research engine that provides cited, real-time answers from the web.",
    pricingModel: "Freemium", startingPrice: "$20/mo", freePlan: true, freeTrial: false,
    rating: 4.6, reviewCount: 18700, verified: true, website: "https://perplexity.ai",
    bestFor: "Research, fact-checking, real-time information",
    easeOfUse: 10, learningCurve: "Very Easy", customerSupport: "Help Center",
    apiAvailable: true, integrations: 50, customization: "Low",
    teamCollab: false, enterpriseSupport: true, mobileApp: true,
    features: ["Real-time web search", "Source citations", "Focus modes", "File upload", "Collections", "API access"],
    pros: ["Always cites sources", "Real-time web data", "Clean minimal interface", "Great for research"],
    cons: ["Limited creative capabilities", "No image generation", "Smaller context for complex tasks"],
    summary: "Perplexity excels at research with real-time citations and source verification.",
  },
  Cursor: {
    description: "AI-first code editor built on VS Code with inline code generation and editing.",
    pricingModel: "Freemium", startingPrice: "$20/mo", freePlan: true, freeTrial: true,
    rating: 4.8, reviewCount: 24300, verified: true, website: "https://cursor.com",
    bestFor: "Full-stack development, code refactoring",
    easeOfUse: 9, learningCurve: "Moderate", customerSupport: "Discord + Docs",
    apiAvailable: false, integrations: 100, customization: "High (rules, .cursorrules)",
    teamCollab: true, enterpriseSupport: true, mobileApp: false,
    features: ["AI code completion", "Multi-file editing", "Chat with codebase", "Composer mode", "Custom rules", "Git integration"],
    pros: ["Best AI coding experience", "Multi-file context awareness", "VS Code compatible extensions", "Rapid iteration speed"],
    cons: ["Subscription required for best models", "Can be resource-heavy", "Learning curve for AI features"],
    summary: "Cursor is the leading AI code editor with unmatched multi-file editing capabilities.",
  },
  Lovable: {
    description: "AI-powered full-stack app builder that generates production-ready React applications.",
    pricingModel: "Freemium", startingPrice: "$25/mo", freePlan: true, freeTrial: false,
    rating: 4.7, reviewCount: 15200, verified: true, website: "https://lovable.dev",
    bestFor: "Rapid app prototyping, MVP building",
    easeOfUse: 10, learningCurve: "Very Easy", customerSupport: "Discord + Email",
    apiAvailable: false, integrations: 30, customization: "Medium",
    teamCollab: true, enterpriseSupport: false, mobileApp: false,
    features: ["Full-stack app generation", "Supabase integration", "Git sync", "Deploy to production", "UI component library", "Database schema generation"],
    pros: ["Fastest app generation", "Production-ready code output", "Beautiful default designs", "One-click deployment"],
    cons: ["Limited to React/Vite stack", "Complex customizations need manual code", "Credit-based usage model"],
    summary: "Lovable generates production-ready full-stack apps faster than any competitor.",
  },
  Midjourney: {
    description: "Premier AI image generation tool known for stunning photorealistic and artistic outputs.",
    pricingModel: "Subscription", startingPrice: "$10/mo", freePlan: false, freeTrial: true,
    rating: 4.9, reviewCount: 42000, verified: true, website: "https://midjourney.com",
    bestFor: "Artistic image generation, concept art, marketing visuals",
    easeOfUse: 7, learningCurve: "Moderate", customerSupport: "Discord Community",
    apiAvailable: false, integrations: 10, customization: "High (style tuning, params)",
    teamCollab: false, enterpriseSupport: false, mobileApp: false,
    features: ["V6 model", "Style tuning", "Inpainting", "Zoom out", "Vary region", "Pan", "Upscale"],
    pros: ["Best-in-class image quality", "Incredible artistic styles", "Active community", "Consistent outputs"],
    cons: ["Discord-only interface", "No free tier", "Learning prompt syntax", "No API access"],
    summary: "Midjourney produces the highest quality AI images, especially for artistic and creative work.",
  },
  Windsurf: {
    description: "AI-powered IDE by Codeium with deep codebase understanding and Cascade flows.",
    pricingModel: "Freemium", startingPrice: "$15/mo", freePlan: true, freeTrial: true,
    rating: 4.6, reviewCount: 12800, verified: true, website: "https://codeium.com/windsurf",
    bestFor: "Code completion, rapid prototyping",
    easeOfUse: 9, learningCurve: "Easy", customerSupport: "Discord + Docs",
    apiAvailable: false, integrations: 80, customization: "Medium",
    teamCollab: true, enterpriseSupport: true, mobileApp: false,
    features: ["Cascade AI flows", "Multi-file editing", "Codebase indexing", "Inline completions", "Terminal AI", "Git integration"],
    pros: ["Generous free tier", "Fast completions", "Clean UI design", "Cascade is innovative"],
    cons: ["Smaller community than Cursor", "Model options more limited", "Newer product, less mature"],
    summary: "Windsurf offers a polished AI coding experience with innovative Cascade flows at a lower price.",
  },
};

// Generate fallback metadata for tools not in TOOL_META
function getToolMeta(name: string): ToolMeta {
  if (TOOL_META[name]) return TOOL_META[name];
  const tool = AI_TOOLS.find(t => t.name === name);
  return {
    description: `${name} is a powerful AI tool in the ${tool?.category || "AI"} category.`,
    pricingModel: tool?.price === "Free" ? "Free" : "Subscription",
    startingPrice: tool?.price || "Contact",
    freePlan: tool?.price === "Free",
    freeTrial: false,
    rating: parseFloat((tool?.score ? tool.score / 20 : 4.0).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 10000) + 1000,
    verified: true,
    website: "#",
    bestFor: `${tool?.category || "General"} tasks`,
    easeOfUse: Math.min(10, Math.floor((tool?.score || 80) / 10)),
    learningCurve: "Moderate",
    customerSupport: "Help Center",
    apiAvailable: Math.random() > 0.3,
    integrations: Math.floor(Math.random() * 200) + 10,
    customization: "Medium",
    teamCollab: Math.random() > 0.4,
    enterpriseSupport: Math.random() > 0.5,
    mobileApp: Math.random() > 0.5,
    features: [`Advanced ${tool?.category || "AI"} capabilities`, "Cloud-based processing", "API access", "Dashboard analytics"],
    pros: [`Strong ${tool?.category || "AI"} performance`, "Regular updates", "Good documentation"],
    cons: ["Premium features require subscription", "Learning curve for advanced features"],
    summary: `${name} is a solid choice for ${tool?.category || "general AI"} workflows.`,
  };
}

const getCompareScore = (toolName: string, metric: string): number => {
  if (COMPARE_DATA[toolName]?.[metric] !== undefined) return COMPARE_DATA[toolName][metric];
  const tool = AI_TOOLS.find((t) => t.name === toolName);
  const baseScore = tool ? Math.round(tool.score / 10) : 8;
  const v = (metric.charCodeAt(0) + metric.charCodeAt(metric.length - 1)) % 3 - 1;
  return Math.max(5, Math.min(10, baseScore + v));
};

function ComparePage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>(["ChatGPT", "Claude", "Gemini"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true, features: true, advanced: false, proscons: true, recommendation: true,
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredTools = useMemo(() => {
    if (!searchQuery) return [];
    return AI_TOOLS.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [searchQuery]);

  const toggle = (name: string) => {
    setSelected(s => s.includes(name) ? s.filter(x => x !== name) : s.length < 4 ? [...s, name] : s);
    setSearchQuery("");
  };

  const toggleSection = (key: string) => {
    setExpandedSections(s => ({ ...s, [key]: !s[key] }));
  };

  const shareUrl = () => {
    const slug = selected.map(s => s.toLowerCase().replace(/[\s.]+/g, "-")).join("-vs-");
    const url = `${window.location.origin}/compare?tools=${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Comparison URL copied to clipboard!");
  };

  const exportCSV = () => {
    const headers = ["Attribute", ...selected];
    const rows = [
      ["Category", ...selected.map(s => AI_TOOLS.find(t => t.name === s)?.category || "")],
      ["Price", ...selected.map(s => getToolMeta(s).startingPrice)],
      ["Rating", ...selected.map(s => getToolMeta(s).rating.toString())],
      ["Free Plan", ...selected.map(s => getToolMeta(s).freePlan ? "Yes" : "No")],
      ...COMPARE_METRICS.map(m => [m, ...selected.map(s => getCompareScore(s, m).toString())]),
    ];
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `optima-compare-${selected.join("-vs-")}.csv`;
    a.click();
    toast.success("CSV exported!");
  };

  // AI recommendation logic
  const bestOverall = useMemo(() => {
    if (selected.length === 0) return null;
    return selected.reduce((best, s) => {
      const score = COMPARE_METRICS.reduce((sum, m) => sum + getCompareScore(s, m), 0);
      const bestScore = COMPARE_METRICS.reduce((sum, m) => sum + getCompareScore(best, m), 0);
      return score > bestScore ? s : best;
    });
  }, [selected]);

  const bestBudget = useMemo(() => {
    if (selected.length === 0) return null;
    return selected.reduce((best, s) => {
      const meta = getToolMeta(s);
      const bestMeta = getToolMeta(best);
      if (meta.freePlan && !bestMeta.freePlan) return s;
      const price = parseFloat(meta.startingPrice.replace(/[^0-9.]/g, "")) || 999;
      const bestPrice = parseFloat(bestMeta.startingPrice.replace(/[^0-9.]/g, "")) || 999;
      return price < bestPrice ? s : best;
    });
  }, [selected]);

  const bestBeginner = useMemo(() => {
    if (selected.length === 0) return null;
    return selected.reduce((best, s) =>
      getToolMeta(s).easeOfUse > getToolMeta(best).easeOfUse ? s : best
    );
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Compare Engine</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">AI Tool Comparison</h1>
        <p className="mt-3 text-muted-foreground">Compare up to 4 AI tools side-by-side. Detailed benchmarks, features, and recommendations.</p>
      </header>

      {/* Search + Selected */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search AI tools to compare..."
            className="h-12 w-full rounded-2xl border border-border bg-card/40 pl-10 pr-4 text-sm outline-none focus:border-brand transition-all"
          />
          {searchFocused && filteredTools.length > 0 && (
            <div className="absolute left-0 right-0 top-14 z-50 rounded-2xl border border-border bg-background/98 backdrop-blur-xl shadow-elegant p-2 animate-scale-in">
              {filteredTools.map(tool => (
                <button
                  key={tool.name}
                  onClick={() => toggle(tool.name)}
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: tool.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{tool.category}</span>
                  </div>
                  {selected.includes(tool.name) ? (
                    <Check className="h-4 w-4 text-brand shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected pills */}
        <div className="flex flex-wrap items-center gap-2">
          {selected.map(s => {
            const tool = AI_TOOLS.find(t => t.name === s);
            return (
              <span key={s} className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-sm font-medium">
                <span className="h-2 w-2 rounded-full" style={{ background: tool?.color }} />
                {s}
                <button onClick={() => toggle(s)} className="hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
          {selected.length < 4 && (
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus()}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-brand/50 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Add tool
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={shareUrl} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select tools to compare</p>
          <p className="text-sm mt-1">Search and add up to 4 AI tools for a side-by-side comparison.</p>
        </div>
      ) : (
        <>
          {/* ═══ AI SUMMARY ═══ */}
          <section className="rounded-3xl glass-strong border border-border/50 p-8 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-bold">AI Comparison Summary</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selected.map(s => {
                  const meta = getToolMeta(s);
                  const tool = AI_TOOLS.find(t => t.name === s);
                  return (
                    <div key={s} className="rounded-2xl glass p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tool?.color }} />
                        <span className="font-semibold text-sm">{s}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{meta.summary}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══ RECOMMENDATIONS ═══ */}
          <SectionHeader title="Best Tool Recommendations" icon={<Trophy className="h-5 w-5" />} sectionKey="recommendation" expanded={expandedSections.recommendation} toggle={toggleSection} />
          {expandedSections.recommendation && (
            <div className="grid gap-3 sm:grid-cols-3">
              {bestOverall && <RecommendationCard label="Best Overall" toolName={bestOverall} icon={<Trophy className="h-5 w-5 text-amber-500" />} color="from-amber-500/20 to-orange-500/20" />}
              {bestBudget && <RecommendationCard label="Best Budget" toolName={bestBudget} icon={<Wallet className="h-5 w-5 text-emerald-500" />} color="from-emerald-500/20 to-teal-500/20" />}
              {bestBeginner && <RecommendationCard label="Best for Beginners" toolName={bestBeginner} icon={<GraduationCap className="h-5 w-5 text-blue-500" />} color="from-blue-500/20 to-indigo-500/20" />}
            </div>
          )}

          {/* ═══ OVERVIEW TABLE ═══ */}
          <SectionHeader title="Overview Comparison" icon={<Gauge className="h-5 w-5" />} sectionKey="overview" expanded={expandedSections.overview} toggle={toggleSection} />
          {expandedSections.overview && (
            <div className="overflow-x-auto rounded-2xl glass" ref={tableRef}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground w-44">Attribute</th>
                    {selected.map(s => {
                      const tool = AI_TOOLS.find(t => t.name === s);
                      return (
                        <th key={s} className="p-4 border-l border-border">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: tool?.color }} />
                            <span className="font-semibold">{s}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Category" values={selected.map(s => AI_TOOLS.find(t => t.name === s)?.category || "")} />
                  <CompareRow label="Description" values={selected.map(s => getToolMeta(s).description)} isLong />
                  <CompareRow label="Pricing Model" values={selected.map(s => getToolMeta(s).pricingModel)} />
                  <CompareRow label="Starting Price" values={selected.map(s => getToolMeta(s).startingPrice)} highlight />
                  <CompareRow label="Free Plan" values={selected.map(s => getToolMeta(s).freePlan)} isBoolean />
                  <CompareRow label="Free Trial" values={selected.map(s => getToolMeta(s).freeTrial)} isBoolean />
                  <CompareRow label="Rating" values={selected.map(s => getToolMeta(s).rating)} isRating />
                  <CompareRow label="Reviews" values={selected.map(s => getToolMeta(s).reviewCount.toLocaleString())} />
                  <CompareRow label="Verified" values={selected.map(s => getToolMeta(s).verified)} isBoolean />
                  <CompareRow label="Website" values={selected.map(s => ({ url: getToolMeta(s).website, name: s }))} isLink />
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ BENCHMARK SCORES + RADAR ═══ */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-2xl glass">
              <div className="p-4 border-b border-border">
                <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand" /> Performance Benchmarks
                </h3>
              </div>
              <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}>
                <div className="p-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Metric</div>
                {selected.map(s => {
                  const t = AI_TOOLS.find(x => x.name === s);
                  return (
                    <div key={s} className="border-l border-border p-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: t?.color }} />
                        <span className="font-medium text-sm">{s}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {COMPARE_METRICS.map(m => (
                <div key={m} className="grid border-b border-border last:border-0" style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}>
                  <div className="p-3 text-sm text-muted-foreground">{m}</div>
                  {selected.map(s => {
                    const v = getCompareScore(s, m);
                    const best = Math.max(...selected.map(sel => getCompareScore(sel, m)));
                    return (
                      <div key={s} className="border-l border-border p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full transition-all duration-500 ${v === best ? "bg-gradient-brand" : "bg-muted-foreground/30"}`} style={{ width: `${v * 10}%` }} />
                          </div>
                          <span className={`font-mono text-sm tabular-nums w-6 ${v === best ? "text-brand font-bold" : ""}`}>{v}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="rounded-2xl glass p-6">
              <h3 className="font-display text-sm font-semibold">Capability Radar</h3>
              <p className="mt-1 text-xs text-muted-foreground">Higher is better.</p>
              <div className="mt-4">
                <RadarChart selected={selected} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {selected.map(s => {
                  const t = AI_TOOLS.find(x => x.name === s);
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: t?.color }} />
                      <span>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══ ADVANCED FEATURES ═══ */}
          <SectionHeader title="Advanced Features" icon={<Shield className="h-5 w-5" />} sectionKey="advanced" expanded={expandedSections.advanced} toggle={toggleSection} />
          {expandedSections.advanced && (
            <div className="overflow-x-auto rounded-2xl glass">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground w-44">Feature</th>
                    {selected.map(s => (
                      <th key={s} className="p-4 border-l border-border font-semibold">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Best For" values={selected.map(s => getToolMeta(s).bestFor)} isLong />
                  <CompareRow label="Ease of Use" values={selected.map(s => getToolMeta(s).easeOfUse)} isScore />
                  <CompareRow label="Learning Curve" values={selected.map(s => getToolMeta(s).learningCurve)} />
                  <CompareRow label="Customer Support" values={selected.map(s => getToolMeta(s).customerSupport)} />
                  <CompareRow label="API Available" values={selected.map(s => getToolMeta(s).apiAvailable)} isBoolean />
                  <CompareRow label="Integrations" values={selected.map(s => `${getToolMeta(s).integrations}+`)} />
                  <CompareRow label="Customization" values={selected.map(s => getToolMeta(s).customization)} />
                  <CompareRow label="Team Collaboration" values={selected.map(s => getToolMeta(s).teamCollab)} isBoolean />
                  <CompareRow label="Enterprise Support" values={selected.map(s => getToolMeta(s).enterpriseSupport)} isBoolean />
                  <CompareRow label="Mobile App" values={selected.map(s => getToolMeta(s).mobileApp)} isBoolean />
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ FEATURES LIST ═══ */}
          <SectionHeader title="Key Features" icon={<Puzzle className="h-5 w-5" />} sectionKey="features" expanded={expandedSections.features} toggle={toggleSection} />
          {expandedSections.features && (
            <div className="overflow-x-auto rounded-2xl glass">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground w-44">Features</th>
                    {selected.map(s => (
                      <th key={s} className="p-4 border-l border-border font-semibold">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border last:border-0">
                    <td className="p-4 text-muted-foreground align-top">Capabilities</td>
                    {selected.map(s => (
                      <td key={s} className="p-4 border-l border-border align-top">
                        <ul className="space-y-1.5">
                          {getToolMeta(s).features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-xs">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ PROS & CONS ═══ */}
          <SectionHeader title="Pros & Cons" icon={<AlertCircle className="h-5 w-5" />} sectionKey="proscons" expanded={expandedSections.proscons} toggle={toggleSection} />
          {expandedSections.proscons && (
            <div className="grid gap-4 sm:grid-cols-2">
              {selected.map(s => {
                const tool = AI_TOOLS.find(x => x.name === s);
                const meta = getToolMeta(s);
                return (
                  <div key={s} className="rounded-2xl glass p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tool?.color }} />
                      <h3 className="font-display text-lg font-semibold">{s}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="flex items-center gap-1 text-xs font-medium text-emerald-500 mb-2"><Check className="h-3 w-3" /> Pros</p>
                        <ul className="space-y-1.5">
                          {meta.pros.map((p, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">·</span>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs font-medium text-rose-500 mb-2"><X className="h-3 w-3" /> Cons</p>
                        <ul className="space-y-1.5">
                          {meta.cons.map((c, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-rose-500 mt-0.5">·</span>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Components ───

function SectionHeader({ title, icon, sectionKey, expanded, toggle }: {
  title: string; icon: React.ReactNode; sectionKey: string; expanded: boolean;
  toggle: (key: string) => void;
}) {
  return (
    <button
      onClick={() => toggle(sectionKey)}
      className="w-full flex items-center justify-between rounded-2xl glass p-4 hover:bg-card/80 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="text-brand">{icon}</div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
    </button>
  );
}

function RecommendationCard({ label, toolName, icon, color }: {
  label: string; toolName: string; icon: React.ReactNode; color: string;
}) {
  const tool = AI_TOOLS.find(t => t.name === toolName);
  const meta = getToolMeta(toolName);
  return (
    <div className={`rounded-2xl glass p-5 relative overflow-hidden`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${color} blur-2xl opacity-60`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: tool?.color }} />
          <span className="text-xl font-bold">{toolName}</span>
        </div>
        <p className="text-xs text-muted-foreground">{meta.startingPrice} · {meta.bestFor}</p>
      </div>
    </div>
  );
}

function CompareRow({ label, values, isBoolean, isRating, isLink, isLong, highlight, isScore }: {
  label: string; values: any[]; isBoolean?: boolean; isRating?: boolean;
  isLink?: boolean; isLong?: boolean; highlight?: boolean; isScore?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className={`p-4 text-muted-foreground ${isLong ? "align-top" : ""}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`p-4 border-l border-border ${isLong ? "align-top" : ""} ${highlight ? "font-semibold text-brand" : ""}`}>
          {isBoolean ? (
            v ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-rose-500/50" />
          ) : isRating ? (
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold">{v}</span>
            </div>
          ) : isLink ? (
            <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand text-xs hover:underline">
              Visit <ExternalLink className="h-3 w-3" />
            </a>
          ) : isScore ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-brand" style={{ width: `${v * 10}%` }} />
              </div>
              <span className="font-mono text-xs">{v}/10</span>
            </div>
          ) : (
            <span className={isLong ? "text-xs leading-relaxed" : ""}>{v}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function RadarChart({ selected }: { selected: string[] }) {
  const metrics = COMPARE_METRICS;
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const angle = (i: number) => (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
  const point = (i: number, val: number) => {
    const a = angle(i);
    const d = (val / 10) * r;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
      {[2, 4, 6, 8, 10].map(lvl => (
        <polygon
          key={lvl}
          points={metrics.map((_, i) => point(i, lvl).join(",")).join(" ")}
          fill="none"
          stroke="oklch(1 0 0 / 0.06)"
          strokeWidth={1}
        />
      ))}
      {metrics.map((_, i) => {
        const [x, y] = point(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(1 0 0 / 0.06)" strokeWidth={1} />;
      })}
      {selected.map(s => {
        const t = AI_TOOLS.find(x => x.name === s);
        const pts = metrics.map((m, i) => point(i, getCompareScore(s, m)).join(",")).join(" ");
        return (
          <g key={s}>
            <polygon points={pts} fill={t?.color} fillOpacity={0.15} stroke={t?.color} strokeWidth={2} />
          </g>
        );
      })}
      {metrics.map((m, i) => {
        const [x, y] = point(i, 11.5);
        return <text key={m} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize={10}>{m}</text>;
      })}
    </svg>
  );
}
