import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Eye, ThumbsUp, Layers, HelpCircle, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { getStacksFn, seedPrebuiltStacksFn } from "../lib/api/stack.functions";
import { CATEGORIES } from "../lib/data/tools";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../hooks/use-auth";

import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/stacks/")({
  head: () => ({
    meta: [
      { title: "Public AI Stacks Gallery — Optima" },
      { name: "description", content: "Explore curated AI workflows and tool stacks created by the community and experts." },
      { property: "og:title", content: "Public AI Stacks Gallery — Optima" },
      { property: "og:description", content: "Explore curated AI workflows and tool stacks." },
    ],
    links: [{ rel: "canonical", href: "/stacks" }],
  }),
  component: () => (
    <ProtectedRoute>
      <StackGallery />
    </ProtectedRoute>
  ),
});

function StackGallery() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "featured">("featured");
  const [stacksList, setStacksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto seed and fetch
  useEffect(() => {
    async function init() {
      try {
        await seedPrebuiltStacksFn();
        const data = await getStacksFn({
          category: category === "All" ? undefined : category,
          search: search || undefined,
          difficulty: difficulty === "All" ? undefined : difficulty,
          sortBy
        });
        setStacksList(data);
      } catch (err) {
        console.error("Error loading stacks:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [category, search, difficulty, sortBy]);

  const difficultyColors: Record<string, string> = {
    Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-3xl mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Workflow Library</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-brand bg-clip-text text-transparent">
          AI Stacks Gallery
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Discover and duplicate pre-built AI tool chains designed for developers, researchers, creators, and founders.
        </p>
      </header>

      {/* Control Panel: Filters & Sorting */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stacks by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
          />
        </div>

        {/* Difficulty */}
        <div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm cursor-pointer text-foreground"
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm cursor-pointer text-foreground"
          >
            <option value="featured">Featured First</option>
            <option value="popular">Most Popular</option>
            <option value="latest">Latest</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-border/40">
        <button
          onClick={() => setCategory("All")}
          className={`px-4 py-2 text-xs font-medium rounded-full transition-all border ${
            category === "All"
              ? "bg-gradient-brand text-brand-foreground border-transparent shadow-glow"
              : "bg-card/40 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-xs font-medium rounded-full transition-all border ${
              category === cat
                ? "bg-gradient-brand text-brand-foreground border-transparent shadow-glow"
                : "bg-card/40 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-border bg-card/20 animate-pulse" />
          ))}
        </div>
      ) : stacksList.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-card/10">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No stacks found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try resetting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stacksList.map((stack) => (
            <Link
              key={stack.id}
              to={`/stacks/${stack.id}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/30 p-6 hover:bg-card/60 transition-all duration-300 hover:border-brand/40 hover:shadow-elegant"
            >
              {/* Top Banner (Featured indicator) */}
              {stack.featured && (
                <div className="absolute top-0 right-0 flex items-center gap-1 bg-brand/10 border-l border-b border-brand/20 px-3 py-1 rounded-bl-xl text-[10px] font-mono tracking-wider text-brand font-semibold">
                  <Award className="h-3 w-3" /> FEATURED
                </div>
              )}

              <div>
                {/* Meta */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${difficultyColors[stack.difficulty_level] || "bg-muted"}`}>
                    {stack.difficulty_level}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{stack.category}</span>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold tracking-tight group-hover:text-brand transition-colors line-clamp-1">
                  {stack.name}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {stack.description}
                </p>

                {/* Tool List Summary */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {stack.tools?.map((tool: any) => (
                    <span
                      key={tool.id}
                      className="px-2 py-1 text-[10px] font-mono rounded bg-card border border-border/50 text-muted-foreground"
                    >
                      {tool.tool_id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex items-center gap-3">
                  {/* Creator Info */}
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand font-mono overflow-hidden">
                      {stack.creator_avatar ? (
                        <img src={stack.creator_avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{stack.creator_name?.charAt(0).toUpperCase() || "A"}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[80px] text-muted-foreground">
                      {stack.creator_name || "Optima"}
                    </span>
                  </div>

                  <span className="text-muted-foreground text-xs">•</span>

                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    {stack.toolCount} tools
                  </span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ThumbsUp className="h-3 w-3" />
                    {stack.likes_count}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Eye className="h-3 w-3" />
                    {stack.views_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
