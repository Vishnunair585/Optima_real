import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Code2, Database, Cloud, Megaphone, Palette, Bot, Download, 
  Save, ArrowRight, Search, Plus, Trash2, ArrowUp, ArrowDown, 
  Sparkles, HelpCircle, X, Check, Laptop, RefreshCw 
} from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";
import { useAuth } from "../hooks/use-auth";
import { AI_TOOLS, CATEGORIES } from "../lib/data/tools";
import { 
  createStackFn, updateStackFn, getStackByIdOrSlugFn, 
  getRecommendationsFn, seedPrebuiltStacksFn 
} from "../lib/api/stack.functions";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";

import { z } from "zod";

const stackBuilderSearchSchema = z.object({
  edit: z.string().optional(),
});

export const Route = createFileRoute("/stack-builder")({
  validateSearch: (search) => stackBuilderSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "AI Stack Builder — Optima" },
      { name: "description", content: "Create, edit, duplicate, and share custom AI workflows." },
    ],
    links: [{ rel: "canonical", href: "/stack-builder" }],
  }),
  component: () => (
    <ProtectedRoute>
      <StackBuilder />
    </ProtectedRoute>
  ),
});

function StackBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // URL Search parameter for edit mode e.g., ?edit=some-uuid
  const searchParams = useSearch({ strict: false }) as any;
  const editId = searchParams?.edit;

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("Coding");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTools, setSelectedTools] = useState<any[]>([]); // { tool_id, position, purpose }

  // Tool Catalog States
  const [toolSearch, setToolSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("All");

  // Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardUserType, setWizardUserType] = useState("Developer");
  const [wizardGoals, setWizardGoals] = useState<string[]>([]);
  const [wizardExp, setWizardExp] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [wizardFavTools, setWizardFavTools] = useState<string[]>([]);
  const [wizardCats, setWizardCats] = useState<string[]>([]);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);

  // Load existing stack for editing
  useEffect(() => {
    async function loadStack() {
      if (editId) {
        try {
          const stack = await getStackByIdOrSlugFn({ id: editId });
          if (stack) {
            setName(stack.name);
            setDescription(stack.description);
            setGoal(stack.goal);
            setCategory(stack.category);
            setDifficulty(stack.difficulty_level as any);
            setIsPublic(stack.is_public);
            setSelectedTools(stack.tools.map((t: any) => ({
              tool_id: t.tool_id,
              position: t.position,
              purpose: t.purpose
            })));
            toast.success("Loaded workflow for editing.");
          }
        } catch (err) {
          toast.error("Failed to load stack for editing.");
        }
      }
    }
    loadStack();
  }, [editId]);

  // Catalog filtering
  const filteredCatalog = AI_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(toolSearch.toLowerCase()) || 
                          tool.category.toLowerCase().includes(toolSearch.toLowerCase());
    const matchesCat = catalogCategory === "All" || tool.category === catalogCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate live costs
  const parseCost = (priceStr: string) => {
    if (!priceStr || priceStr.toLowerCase() === "free") return 0;
    const match = priceStr.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getToolMetadata = (toolName: string) => {
    return AI_TOOLS.find(t => t.name.toLowerCase() === toolName.toLowerCase()) || {
      name: toolName,
      category: "Utility",
      score: 80,
      price: "Free",
      vendor: "Other",
      color: "oklch(0.6 0.1 220)"
    };
  };

  const monthlyCost = selectedTools.reduce((sum, t) => {
    const meta = getToolMetadata(t.tool_id);
    return sum + parseCost(meta.price);
  }, 0);

  const averageScore = selectedTools.length > 0 
    ? Math.round(selectedTools.reduce((sum, t) => sum + getToolMetadata(t.tool_id).score, 0) / selectedTools.length)
    : 0;

  // Selected tool operations
  const addTool = (toolName: string) => {
    if (selectedTools.find(t => t.tool_id === toolName)) {
      toast.warning(`${toolName} is already added to the stack.`);
      return;
    }
    const nextPos = selectedTools.length + 1;
    const defaultPurpose = `Workflow execution for ${toolName}`;
    setSelectedTools([...selectedTools, {
      tool_id: toolName,
      position: nextPos,
      purpose: defaultPurpose
    }]);
    toast.success(`Added ${toolName}`);
  };

  const removeTool = (toolName: string) => {
    const updated = selectedTools
      .filter(t => t.tool_id !== toolName)
      .map((t, index) => ({ ...t, position: index + 1 }));
    setSelectedTools(updated);
  };

  const updatePurpose = (toolName: string, purpose: string) => {
    const updated = selectedTools.map(t => {
      if (t.tool_id === toolName) {
        return { ...t, purpose };
      }
      return t;
    });
    setSelectedTools(updated);
  };

  const moveTool = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedTools.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...selectedTools];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Fix positions
    const res = updated.map((t, idx) => ({ ...t, position: idx + 1 }));
    setSelectedTools(res);
  };

  // Recommendations Submit
  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rec = await getRecommendationsFn({
        userType: wizardUserType,
        goals: wizardGoals.length > 0 ? wizardGoals : ["Automate tasks"],
        experienceLevel: wizardExp,
        favoriteTools: wizardFavTools,
        categories: wizardCats.length > 0 ? wizardCats : ["Automation"],
      });
      setRecommendationResult(rec);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate recommendations.");
    }
  };

  const applyRecommendation = () => {
    if (!recommendationResult) return;
    setName(recommendationResult.name);
    setDescription(recommendationResult.description);
    setGoal(recommendationResult.goal);
    setCategory(recommendationResult.category);
    setDifficulty(recommendationResult.difficulty_level);
    setSelectedTools(recommendationResult.tools);
    setIsWizardOpen(false);
    toast.success("Applied recommendation successfully!");
  };

  // Submit Save Stack
  const handleSaveStack = async () => {
    if (!name.trim()) {
      toast.error("Stack Name is required.");
      return;
    }
    if (selectedTools.length === 0) {
      toast.error("Please add at least 1 tool to the stack.");
      return;
    }

    try {
      if (editId) {
        await updateStackFn({
          id: editId,
          name,
          description,
          goal,
          category,
          difficulty_level: difficulty,
          is_public: isPublic,
          tools: selectedTools
        });
        toast.success("Stack updated successfully!");
        navigate({ to: `/stacks/${editId}` });
      } else {
        const res = await createStackFn({
          name,
          description,
          goal,
          category,
          difficulty_level: difficulty,
          is_public: isPublic,
          tools: selectedTools
        });
        toast.success("Stack created successfully!");
        navigate({ to: `/stacks/${res.stackId}` });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save stack.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-brand bg-clip-text text-transparent">
            {editId ? "Edit AI Stack" : "AI Stack Builder"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assemble multiple AI tools, define their exact purpose, and compute live workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-5 text-sm font-semibold text-brand hover:bg-brand/10 transition-all shadow-glow"
          >
            <Sparkles className="h-4.5 w-4.5 animate-pulse" /> AI Recommendation Engine
          </button>
          
          <button
            onClick={handleSaveStack}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-brand-foreground shadow-glow"
          >
            <Save className="h-4 w-4" /> Save Stack
          </button>
        </div>
      </header>

      {/* Main Grid: Form/Sequencing on Left, Catalog on Right */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Config and Sequencing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Section */}
          <div className="glass p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold tracking-tight">1. Workflow Parameters</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Stack Name</label>
                <input
                  type="text"
                  placeholder="e.g. Startup Founder Stack"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Primary Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Build and launch a SaaS MVP"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Description & Target Use-case</label>
              <textarea
                placeholder="Describe what this stack achieves and how the tools sync..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm text-foreground cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm text-foreground cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Privacy Setting</label>
                <select
                  value={isPublic ? "true" : "false"}
                  onChange={(e) => setIsPublic(e.target.value === "true")}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card/40 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-sm text-foreground cursor-pointer"
                >
                  <option value="true">Public Gallery</option>
                  <option value="false">Private Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sequence builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-base font-bold tracking-tight">2. Workflow Pipeline ({selectedTools.length} Tools)</h3>
              {selectedTools.length === 0 && (
                <span className="text-xs text-muted-foreground font-mono">Use the Catalog on the right to add tools.</span>
              )}
            </div>

            <div className="space-y-3">
              {selectedTools.map((t, index) => {
                const meta = getToolMetadata(t.tool_id);
                return (
                  <div 
                    key={t.tool_id}
                    className="flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-border/80 bg-card/40 p-4 relative"
                  >
                    {/* Position & Reorder triggers */}
                    <div className="flex sm:flex-col items-center gap-1 shrink-0 self-stretch justify-between sm:justify-start">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-mono text-brand font-bold">
                        {t.position}
                      </span>
                      
                      <div className="flex sm:flex-col gap-0.5">
                        <button
                          onClick={() => moveTool(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveTool(index, "down")}
                          disabled={index === selectedTools.length - 1}
                          className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm truncate">{t.tool_id}</h4>
                        <Badge className="text-[9px] font-mono uppercase bg-muted text-muted-foreground border-border/40">
                          {meta.category}
                        </Badge>
                        <span className="text-xs text-emerald-400 font-mono font-medium">{meta.price}</span>
                      </div>

                      <div className="mt-2.5">
                        <input
                          type="text"
                          placeholder="What is the purpose of this tool in the stack? (e.g. Design assets)"
                          value={t.purpose}
                          onChange={(e) => updatePurpose(t.tool_id, e.target.value)}
                          className="w-full h-8 px-2.5 rounded border border-border bg-background focus:border-brand outline-none transition-all text-xs"
                        />
                      </div>
                    </div>

                    {/* Delete Trigger */}
                    <button
                      onClick={() => removeTool(t.tool_id)}
                      className="p-1.5 rounded-lg border border-border/30 hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 self-end sm:self-auto cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {selectedTools.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl bg-card/10">
                  <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
                  <p className="text-sm font-semibold">Workflow is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Select tools from the catalog on the right to start building.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Estimates & Tool Catalog */}
        <div className="space-y-6">
          {/* Live Preview scoreboard */}
          <div className="glass p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-sm font-bold tracking-tight">Live Metrics Preview</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border/40 p-3 rounded-xl bg-card/20">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Est. Monthly Cost</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">${monthlyCost}/mo</p>
              </div>

              <div className="border border-border/40 p-3 rounded-xl bg-card/20">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Avg Productivity</p>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">{averageScore}/100</p>
              </div>
            </div>
          </div>

          {/* Tool Catalog Selection */}
          <div className="glass p-6 rounded-2xl border border-border flex flex-col h-[500px]">
            <h3 className="text-sm font-bold tracking-tight mb-3">Add Tools Catalog</h3>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 rounded-lg border border-border bg-background focus:border-brand outline-none transition-all text-xs"
              />
            </div>

            {/* Cat Selector */}
            <select
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
              className="w-full h-8.5 px-2.5 rounded-lg border border-border bg-background outline-none text-xs text-foreground cursor-pointer mb-3"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Catalog list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
              {filteredCatalog.map(tool => {
                const isAdded = selectedTools.some(x => x.tool_id === tool.name);
                return (
                  <div 
                    key={tool.name} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border border-border/40 transition-all ${
                      isAdded ? "bg-brand/5 border-brand/20 opacity-70" : "bg-card/40 hover:bg-accent"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">{tool.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tool.category} • {tool.price}</p>
                    </div>

                    <button
                      onClick={() => addTool(tool.name)}
                      disabled={isAdded}
                      className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        isAdded ? "border-brand/30 text-brand" : "border-border hover:border-brand hover:text-brand"
                      }`}
                    >
                      {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Wizard Dialog Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-background/95 p-6 shadow-elegant animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-bold">AI Workflow Recommendation Engine</h3>
              </div>
              <button 
                onClick={() => {
                  setIsWizardOpen(false);
                  setRecommendationResult(null);
                }} 
                className="p-1 rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form & Recommendations */}
            {!recommendationResult ? (
              <form onSubmit={handleWizardSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">User Type / Role</label>
                    <select
                      value={wizardUserType}
                      onChange={(e) => setWizardUserType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-sm text-foreground cursor-pointer"
                    >
                      <option value="Developer">Developer</option>
                      <option value="Content Creator">Content Creator</option>
                      <option value="Startup Founder">Startup Founder</option>
                      <option value="Student">Student</option>
                      <option value="Researcher">Researcher</option>
                      <option value="Designer">Designer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Experience Level</label>
                    <select
                      value={wizardExp}
                      onChange={(e) => setWizardExp(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-sm text-foreground cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Workflow Goals (Separate with comma)</label>
                  <input
                    type="text"
                    placeholder="e.g. Build landing page, host vector databases, automate lead syncs"
                    onChange={(e) => setWizardGoals(e.target.value.split(",").map(x => x.trim()))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Categories needed (Select multiple)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => {
                      const isSelected = wizardCats.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => {
                            if (isSelected) {
                              setWizardCats(wizardCats.filter(x => x !== cat));
                            } else {
                              setWizardCats([...wizardCats, cat]);
                            }
                          }}
                          className={`h-9 px-3 border rounded-xl text-xs font-medium transition-all text-left truncate flex items-center justify-between ${
                            isSelected ? "border-brand bg-brand/10 text-brand" : "border-border bg-card/40 hover:bg-accent text-muted-foreground"
                          }`}
                        >
                          {cat}
                          {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Favorite AI tools already in use (Separate with comma)</label>
                  <input
                    type="text"
                    placeholder="e.g. ChatGPT, Claude, Cursor"
                    onChange={(e) => setWizardFavTools(e.target.value.split(",").map(x => x.trim()))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-sm"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40">
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-brand px-6 text-sm font-semibold text-brand-foreground shadow-glow"
                  >
                    Generate Recommendation
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="border border-brand/20 bg-brand/5 p-4 rounded-2xl">
                  <h4 className="text-sm font-mono text-brand font-semibold uppercase">Recommended Stack For You</h4>
                  <p className="text-lg font-bold mt-1 text-foreground">{recommendationResult.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{recommendationResult.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase text-muted-foreground">Workflow sequence outline:</p>
                  {recommendationResult.tools.map((t: any) => (
                    <div key={t.tool_id} className="flex items-center justify-between p-3 border border-border/40 bg-card/40 rounded-xl text-xs">
                      <div>
                        <span className="font-mono text-brand mr-2">Step {t.position}:</span>
                        <span className="font-semibold text-foreground">{t.tool_id}</span>
                      </div>
                      <span className="text-muted-foreground truncate max-w-[250px]">{t.purpose}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <button
                    onClick={() => setRecommendationResult(null)}
                    className="h-10 border border-border rounded-full px-5 text-sm font-semibold hover:bg-accent"
                  >
                    Edit Filters
                  </button>

                  <button
                    onClick={applyRecommendation}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-brand px-6 text-sm font-semibold text-brand-foreground shadow-glow"
                  >
                    Apply Workflow Recommendation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
