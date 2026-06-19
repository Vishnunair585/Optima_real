import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, ThumbsUp, Bookmark, Copy, FileText, ArrowRight, 
  Trash2, MessageSquare, CornerDownRight, ShieldAlert, BadgeCheck,
  TrendingUp, Activity, BookOpen, Layers, Zap, Landmark
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { 
  getStackByIdOrSlugFn, toggleLikeStackFn, toggleBookmarkStackFn, 
  addCommentFn, deleteCommentFn, duplicateStackFn, deleteStackFn 
} from "../lib/api/stack.functions";
import { AI_TOOLS } from "../lib/data/tools";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";

import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/stacks/$id")({
  head: ({ loaderData }: any) => ({
    meta: [
      { title: `${loaderData?.name || "AI Stack"} — AIRank` },
      { name: "description", content: loaderData?.description || "Explore and duplicate this AI workflow." },
      { property: "og:title", content: loaderData?.name },
      { property: "og:description", content: loaderData?.description },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await getStackByIdOrSlugFn({ id: params.id });
    } catch {
      return null;
    }
  },
  component: () => (
    <ProtectedRoute>
      <StackDetails />
    </ProtectedRoute>
  ),
});

function StackDetails() {
  const data = Route.useLoaderData() as any;
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stack, setStack] = useState<any>(data);
  const [likeCount, setLikeCount] = useState(data?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(data?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(data?.isBookmarked || false);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setStack(data);
      setLikeCount(data.likes_count);
      setIsLiked(data.isLiked || false);
      setIsBookmarked(data.isBookmarked || false);
    }
  }, [data]);

  if (!stack) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold">Stack Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested workflow stack does not exist or has been deleted.</p>
        <Link to="/stacks" className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-gradient-brand px-5 text-sm font-medium text-brand-foreground shadow-glow">
          Back to Gallery
        </Link>
      </div>
    );
  }

  // Calculate Costs
  const parseCost = (priceStr: string) => {
    if (!priceStr || priceStr.toLowerCase() === "free") return 0;
    const match = priceStr.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getToolMetadata = (toolName: string) => {
    return AI_TOOLS.find(t => t.name.toLowerCase() === toolName.toLowerCase()) || {
      name: toolName,
      category: "Utility",
      score: 85,
      price: "Free",
      vendor: "Other",
      color: "oklch(0.6 0.1 220)"
    };
  };

  const toolDetails = stack.tools.map((st: any) => ({
    ...st,
    meta: getToolMetadata(st.tool_id)
  }));

  const monthlyCost = toolDetails.reduce((sum: number, t: any) => sum + parseCost(t.meta.price), 0);
  const yearlyCost = monthlyCost * 12;

  // Calculate Scores (0-100 scale)
  const averageProductivity = Math.round(
    toolDetails.reduce((sum: number, t: any) => sum + (t.meta.score || 85), 0) / (toolDetails.length || 1)
  );

  const costScore = Math.max(20, 100 - Math.round(monthlyCost / 1.5));
  
  const learningScore = stack.difficulty_level === "Beginner" ? 95 : stack.difficulty_level === "Intermediate" ? 75 : 50;

  const hasAutomation = toolDetails.some((t: any) => t.meta.category === "Automation" || t.meta.category === "AI Agents");
  const automationScore = hasAutomation ? 92 : 60;

  const beginnerScore = stack.difficulty_level === "Beginner" ? 96 : stack.difficulty_level === "Intermediate" ? 70 : 40;

  // Free suggestions generator
  const getFreeAlternative = (t: any) => {
    if (t.meta.price === "Free" || parseCost(t.meta.price) === 0) return null;
    // Search in same category for Free tools
    const alternatives = AI_TOOLS.filter(x => x.category === t.meta.category && x.price.toLowerCase() === "free" && x.name !== t.meta.name);
    return alternatives.length > 0 ? alternatives[0].name : "Hugging Face Chat";
  };

  // Actions
  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like this stack.");
      return;
    }
    try {
      const res = await toggleLikeStackFn({ stackId: stack.id });
      setIsLiked(res.liked);
      setLikeCount(prev => res.liked ? prev + 1 : Math.max(0, prev - 1));
      toast.success(res.liked ? "Liked!" : "Unliked.");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle like.");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please log in to bookmark this stack.");
      return;
    }
    try {
      const res = await toggleBookmarkStackFn({ stackId: stack.id });
      setIsBookmarked(res.bookmarked);
      toast.success(res.bookmarked ? "Bookmarked!" : "Removed bookmark.");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle bookmark.");
    }
  };

  const handleDuplicate = async () => {
    if (!user) {
      toast.error("Please log in to duplicate this stack.");
      return;
    }
    try {
      const res = await duplicateStackFn({ id: stack.id });
      toast.success("Stack duplicated to your account!");
      navigate({ to: `/stack-builder?edit=${res.newStackId}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate stack.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this stack?")) return;
    try {
      await deleteStackFn({ id: stack.id });
      toast.success("Stack deleted successfully.");
      navigate({ to: "/stacks" });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete.");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to leave a comment.");
      return;
    }
    if (!commentText.trim()) return;
    try {
      await addCommentFn({ stackId: stack.id, content: commentText });
      toast.success("Comment posted!");
      setCommentText("");
      // Refresh details
      const fresh = await getStackByIdOrSlugFn({ id: stack.id });
      setStack(fresh);
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment.");
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!user) {
      toast.error("Please log in to reply.");
      return;
    }
    if (!replyText.trim()) return;
    try {
      await addCommentFn({ stackId: stack.id, content: replyText, parentId });
      toast.success("Reply posted!");
      setReplyText("");
      setReplyToId(null);
      const fresh = await getStackByIdOrSlugFn({ id: stack.id });
      setStack(fresh);
    } catch (err: any) {
      toast.error(err.message || "Failed to reply.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteCommentFn({ commentId });
      toast.success("Comment removed.");
      const fresh = await getStackByIdOrSlugFn({ id: stack.id });
      setStack(fresh);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment.");
    }
  };

  // Export Markdowns
  const exportMarkdown = () => {
    const md = `# ${stack.name}\n\n**Category**: ${stack.category} | **Difficulty**: ${stack.difficulty_level}\n\n**Goal**: ${stack.goal}\n\n## Description\n${stack.description}\n\n## AI Workflow Tools\n${toolDetails.map((t: any) => `### ${t.position}. ${t.tool_id}\n- **Role**: ${t.purpose}\n- **Cost**: ${t.meta.price}\n- **Category**: ${t.meta.category}`).join("\n\n")}\n\n---\n*Exported from AIRank AI Stack Builder*`;
    
    navigator.clipboard.writeText(md);
    toast.success("Markdown documentation copied to clipboard!");
  };

  // Export PDF / Image
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 print:py-0">
      {/* Back button */}
      <Link to="/stacks" className="inline-flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground hover:text-foreground mb-6 print:hidden">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to gallery
      </Link>

      {/* Main Grid: Info + Sequencing */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Sequence & Designer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="font-mono text-xs uppercase bg-brand/10 border-brand/20 text-brand">
                    {stack.category}
                  </Badge>
                  <Badge className="font-mono text-xs uppercase bg-muted border-border text-muted-foreground">
                    {stack.difficulty_level}
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-brand bg-clip-text text-transparent sm:text-4xl">
                  {stack.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Created by <span className="text-foreground font-semibold">{stack.creator_name || "Optima"}</span>
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleLike}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                    isLiked ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-accent text-muted-foreground"
                  }`}
                  title="Like Stack"
                >
                  <ThumbsUp className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={handleBookmark}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                    isBookmarked ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-accent text-muted-foreground"
                  }`}
                  title="Bookmark Stack"
                >
                  <Bookmark className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={handleDuplicate}
                  className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>

                {/* Owner controls */}
                {user && (stack.user_id === user.id || user.role === "Admin") && (
                  <>
                    <Link
                      to={`/stack-builder?edit=${stack.id}`}
                      className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Primary Goal</h3>
                <p className="text-base text-foreground font-medium mt-1">{stack.goal}</p>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Overview & Architecture</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{stack.description}</p>
              </div>
            </div>
          </div>

          {/* Workflow Sequence */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight px-2">Workflow Design Sequence</h3>
            <div className="space-y-3 relative">
              {toolDetails.map((t: any, index: number) => (
                <div 
                  key={t.id} 
                  className="group relative flex items-start gap-4 overflow-hidden rounded-2xl glass border border-border/80 p-5 hover:bg-card/50 transition-all duration-300"
                >
                  {/* Step Connector */}
                  {index < toolDetails.length - 1 && (
                    <div className="absolute left-[34px] top-[70px] bottom-[-22px] w-0.5 bg-gradient-to-b from-brand/50 to-transparent pointer-events-none print:hidden" />
                  )}

                  {/* Step number indicator */}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 border border-brand/20 text-xs font-mono text-brand font-bold">
                    {t.position}
                  </span>

                  {/* Tool info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display text-base font-bold text-foreground truncate">{t.tool_id}</h4>
                      <Badge className="text-[9px] font-mono uppercase bg-muted border-border/40 text-muted-foreground">
                        {t.meta.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60 font-mono">by {t.meta.vendor}</span>
                    </div>

                    <div className="mt-2.5 rounded-xl bg-card/60 border border-border/30 p-3.5">
                      <p className="text-xs font-mono text-brand uppercase tracking-wider">Designated Workflow Purpose:</p>
                      <p className="text-sm text-foreground font-medium mt-1">{t.purpose}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {t.meta.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Score, Costs, Exports */}
        <div className="space-y-6">
          {/* Scoreboard Cards */}
          <div className="glass p-6 rounded-3xl border border-border">
            <h3 className="text-base font-bold tracking-tight mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {/* Productivity Score */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> Productivity</span>
                  <span className="font-bold text-cyan-400">{averageProductivity}/100</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${averageProductivity}%` }} />
                </div>
              </div>

              {/* Beginner Friendliness */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Beginner Friendliness</span>
                  <span className="font-bold text-emerald-400">{beginnerScore}/100</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${beginnerScore}%` }} />
                </div>
              </div>

              {/* Cost Efficiency */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Landmark className="h-3.5 w-3.5 text-amber-400" /> Cost Score</span>
                  <span className="font-bold text-amber-400">{costScore}/100</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${costScore}%` }} />
                </div>
              </div>

              {/* Automation Score */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Zap className="h-3.5 w-3.5 text-purple-400" /> Automation & APIs</span>
                  <span className="font-bold text-purple-400">{automationScore}/100</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${automationScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Estimation */}
          <div className="glass p-6 rounded-3xl border border-border">
            <h3 className="text-base font-bold tracking-tight mb-4">Cost Estimator</h3>
            
            <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4 mb-4">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Monthly Cost</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">${monthlyCost}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Yearly Cost</p>
                <p className="text-2xl font-extrabold text-emerald-400/80 mt-0.5">${yearlyCost}</p>
              </div>
            </div>

            {/* Alternatives section */}
            <div>
              <h4 className="text-xs font-mono uppercase text-muted-foreground mb-3">Free Alternatives suggestions</h4>
              <div className="space-y-2.5">
                {toolDetails.map((t: any) => {
                  const alt = getFreeAlternative(t);
                  if (!alt) return null;
                  return (
                    <div key={t.id} className="flex items-center justify-between text-xs border border-border/20 bg-card/40 p-2.5 rounded-xl">
                      <span className="text-muted-foreground truncate max-w-[120px]">{t.tool_id} ({t.meta.price})</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-emerald-400">{alt} (Free)</span>
                    </div>
                  );
                })}
                {monthlyCost === 0 && (
                  <p className="text-xs text-muted-foreground italic">This stack uses entirely free tools! No costs required.</p>
                )}
              </div>
            </div>
          </div>

          {/* Share and Export */}
          <div className="glass p-6 rounded-3xl border border-border print:hidden">
            <h3 className="text-base font-bold tracking-tight mb-4">Share & Export</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportMarkdown}
                className="flex items-center justify-center gap-2 h-11 border border-border rounded-2xl text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-4 w-4" /> Markdown Documentation
              </button>
              <button
                onClick={triggerPrint}
                className="flex items-center justify-center gap-2 h-11 border border-border rounded-2xl text-xs font-medium hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <Layers className="h-4 w-4" /> Export PDF / Image
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Board / Comments Section */}
      <div className="mt-12 glass p-8 rounded-3xl border border-border print:hidden">
        <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-brand" /> Discussion ({stack.comments?.length || 0} Comments)
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Discuss this AI stack workflow, suggest improvements, or ask questions..."
            rows={3}
            className="w-full p-4 rounded-xl border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-brand px-5 text-xs font-semibold text-brand-foreground shadow-glow"
            >
              Post Comment
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {stack.comments?.map((c: any) => (
            <div key={c.id} className="border-b border-border/40 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand font-mono overflow-hidden">
                    {c.user.avatar ? (
                      <img src={c.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{c.user.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{c.user.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                      {new Date(c.created_at * 1000).toLocaleDateString()}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1.5">{c.content}</p>
                  </div>
                </div>

                {/* Moderate Comment */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReplyToId(c.id);
                      setReplyText("");
                    }}
                    className="text-[11px] font-medium text-brand hover:underline"
                  >
                    Reply
                  </button>
                  {user && (c.user_id === user.id || user.role === "Admin") && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Delete Comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Nested replies list */}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-10 mt-4 pl-4 border-l-2 border-border/40 space-y-4">
                  {c.replies.map((reply: any) => (
                    <div key={reply.id} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <CornerDownRight className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-1" />
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand font-mono overflow-hidden">
                          {reply.user.avatar ? (
                            <img src={reply.user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{reply.user.name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-foreground">{reply.user.name}</span>
                          <span className="text-[9px] text-muted-foreground ml-2 font-mono">
                            {new Date(reply.created_at * 1000).toLocaleDateString()}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{reply.content}</p>
                        </div>
                      </div>

                      {user && (reply.user_id === user.id || user.role === "Admin") && (
                        <button
                          onClick={() => handleDeleteComment(reply.id)}
                          className="text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form Trigger */}
              {replyToId === c.id && (
                <div className="ml-10 mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-xs"
                  />
                  <button
                    onClick={() => handleReplySubmit(c.id)}
                    className="h-9 rounded-lg bg-brand px-4 text-xs font-semibold text-brand-foreground"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyToId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
