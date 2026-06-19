import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/use-auth";
import { completeOnboardingFn, checkUsernameFn } from "../lib/api/onboarding.functions";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Target,
  Zap,
  Wrench,
  Layers,
  Camera,
  Search,
  X,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete Setup — AIRank" },
      { name: "description", content: "Personalize your AIRank experience." },
    ],
  }),
  component: OnboardingWizard,
});

const TOTAL_STEPS = 6;

const USER_TYPES = [
  { label: "Student", icon: "🎓" },
  { label: "Developer", icon: "💻" },
  { label: "Founder", icon: "🚀" },
  { label: "Designer", icon: "🎨" },
  { label: "Marketer", icon: "📈" },
  { label: "Researcher", icon: "🔬" },
  { label: "Business Owner", icon: "🏢" },
  { label: "Other", icon: "✨" },
];

const GOALS = [
  { label: "Build Apps", icon: "📱" },
  { label: "Learn AI", icon: "🧠" },
  { label: "Generate Content", icon: "✍️" },
  { label: "Marketing", icon: "📊" },
  { label: "Research", icon: "🔍" },
  { label: "Productivity", icon: "⚡" },
  { label: "Coding", icon: "👨‍💻" },
  { label: "Design", icon: "🎨" },
  { label: "Business Growth", icon: "📈" },
  { label: "Automation", icon: "🤖" },
];

const EXPERIENCES = [
  { level: "Beginner", desc: "Just starting to explore AI tools.", color: "from-emerald-500 to-teal-500" },
  { level: "Intermediate", desc: "Comfortable with prompts and APIs.", color: "from-blue-500 to-indigo-500" },
  { level: "Advanced", desc: "Building agentic workflows and fine-tuning models.", color: "from-purple-500 to-pink-500" },
];

const AI_TOOLS = [
  "ChatGPT", "Claude", "Gemini", "Perplexity", "Midjourney",
  "Cursor", "Lovable", "Bolt", "Notion AI", "GitHub Copilot",
  "DALL·E", "Stable Diffusion", "Runway", "Jasper", "Copy.ai",
  "Replit", "v0", "Figma AI", "Grammarly", "Otter.ai",
];

const INTEREST_CATEGORIES = [
  { label: "Coding", icon: "💻" },
  { label: "Writing", icon: "✍️" },
  { label: "Image Generation", icon: "🖼️" },
  { label: "Video Generation", icon: "🎬" },
  { label: "Marketing", icon: "📢" },
  { label: "Sales", icon: "💰" },
  { label: "Productivity", icon: "⚡" },
  { label: "Education", icon: "📚" },
  { label: "Research", icon: "🔬" },
  { label: "Business", icon: "🏢" },
];

function OnboardingWizard() {
  const { user, isLoaded, isSignedIn, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [userType, setUserType] = useState("");
  // Step 2
  const [goals, setGoals] = useState<string[]>([]);
  // Step 3
  const [experience, setExperience] = useState("");
  // Step 4
  const [favoriteTools, setFavoriteTools] = useState<string[]>([]);
  const [toolSearch, setToolSearch] = useState("");
  // Step 5
  const [categories, setCategories] = useState<string[]>([]);
  // Step 6
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/login" });
    }
    if (isLoaded && isSignedIn && user?.onboarded) {
      navigate({ to: "/dashboard" });
    }
    if (user && !fullName) {
      setFullName(user.name || "");
      // Auto-generate username from name
      if (!username && user.name) {
        const auto = user.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + Math.floor(Math.random() * 100);
        setUsername(auto);
      }
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setUsernameAvailable(false);
      return;
    }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameFn({ data: { username } });
        setUsernameAvailable(result.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const toggleItem = useCallback((arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  }, []);

  const handleNext = () => {
    setError("");
    if (step === 1 && !userType) { setError("Please select your role."); return; }
    if (step === 2 && goals.length === 0) { setError("Please select at least one goal."); return; }
    if (step === 3 && !experience) { setError("Please select your experience level."); return; }
    // Step 4 & 5 are optional
    if (step === 6 && !fullName) { setError("Please enter your name."); return; }
    if (step === 6 && (!username || usernameAvailable === false)) { setError("Please choose a valid, available username."); return; }
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => { setError(""); setStep(s => Math.max(s - 1, 1)); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !username || usernameAvailable === false) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await completeOnboardingFn({
        data: {
          fullName,
          username,
          avatarUrl: avatarPreview || undefined,
          userType,
          experienceLevel: experience,
          goals,
          favoriteTools,
          categories,
        },
      });

      await refreshSession();

      // Small delay for the completion animation
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-glow h-10 w-10 rounded-full bg-brand/20" />
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  const filteredTools = AI_TOOLS.filter(t => t.toLowerCase().includes(toolSearch.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-radial-gradient opacity-40 pointer-events-none" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand/10 blur-[100px] mix-blend-screen" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-2/10 blur-[100px] mix-blend-screen" />

      <div className="w-full max-w-2xl relative z-10 animate-fade-up">
        <div className="rounded-3xl glass-strong border border-border/50 p-8 sm:p-12 shadow-elegant overflow-hidden relative">

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand animate-pulse-glow" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Step {step} of {TOTAL_STEPS}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive animate-shake">
              <X className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="min-h-[340px] transition-all duration-300">

            {/* ======= STEP 1: USER TYPE ======= */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-8">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">Who are you?</h2>
                  <p className="text-sm text-muted-foreground">
                    This helps us tailor AI recommendations for your use case.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {USER_TYPES.map(({ label, icon }) => {
                    const isSelected = userType === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setUserType(label)}
                        className={`relative p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? "border-brand bg-brand/10 ring-1 ring-brand shadow-glow-sm"
                            : "border-border hover:border-brand/50 bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-2xl">{icon}</span>
                        <span className={`text-xs font-semibold ${isSelected ? "text-foreground" : ""}`}>{label}</span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-3.5 w-3.5 text-brand" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======= STEP 2: MAIN GOAL ======= */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-8">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <Target className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">What do you want to achieve?</h2>
                  <p className="text-sm text-muted-foreground">
                    Select all that apply. We'll personalize your dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {GOALS.map(({ label, icon }) => {
                    const isSelected = goals.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleItem(goals, setGoals, label)}
                        className={`relative p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "border-brand bg-brand/10 ring-1 ring-brand shadow-glow-sm"
                            : "border-border hover:border-brand/50 bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-foreground" : ""}`}>{label}</span>
                        {isSelected && <div className="absolute top-1.5 right-1.5"><Check className="h-3 w-3 text-brand" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======= STEP 3: AI EXPERIENCE ======= */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-8">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">How experienced are you with AI?</h2>
                  <p className="text-sm text-muted-foreground">
                    This determines the complexity of recommendations.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {EXPERIENCES.map(({ level, desc, color }) => {
                    const isSelected = experience === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setExperience(level)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-brand bg-brand/10 ring-1 ring-brand"
                            : "border-border hover:border-brand/50 bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${color}`} />
                          <div className="flex flex-col items-start">
                            <span className={`font-semibold text-lg ${isSelected ? "text-foreground" : ""}`}>{level}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                          </div>
                        </div>
                        <div className={`grid h-6 w-6 place-items-center rounded-full border shrink-0 transition-colors ${
                          isSelected ? "border-brand bg-gradient-brand text-brand-foreground" : "border-border"
                        }`}>
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======= STEP 4: FAVORITE AI TOOLS ======= */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-6">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">Your favorite AI tools</h2>
                  <p className="text-sm text-muted-foreground">
                    Select tools you already use. <span className="text-muted-foreground/60">(Optional)</span>
                  </p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="h-11 w-full rounded-xl border border-border bg-card/40 pl-10 pr-4 text-sm outline-none focus:border-brand transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredTools.map(tool => {
                    const isSelected = favoriteTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        onClick={() => toggleItem(favoriteTools, setFavoriteTools, tool)}
                        className={`p-3 rounded-xl border text-center transition-all text-sm font-medium ${
                          isSelected
                            ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/50"
                            : "border-border bg-card/40 text-muted-foreground hover:border-brand/50 hover:text-foreground"
                        }`}
                      >
                        {tool}
                      </button>
                    );
                  })}
                </div>

                {favoriteTools.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {favoriteTools.length} tool{favoriteTools.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            {/* ======= STEP 5: INTEREST CATEGORIES ======= */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-8">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">Interest categories</h2>
                  <p className="text-sm text-muted-foreground">
                    Select topics you care about. <span className="text-muted-foreground/60">(Optional)</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {INTEREST_CATEGORIES.map(({ label, icon }) => {
                    const isSelected = categories.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleItem(categories, setCategories, label)}
                        className={`relative p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "border-brand bg-brand/10 ring-1 ring-brand shadow-glow-sm"
                            : "border-border hover:border-brand/50 bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-foreground" : ""}`}>{label}</span>
                        {isSelected && <div className="absolute top-1.5 right-1.5"><Check className="h-3 w-3 text-brand" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======= STEP 6: PROFILE COMPLETION ======= */}
            {step === 6 && !loading && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center sm:text-left mb-8">
                  <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow mb-6">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gradient">Complete your profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Almost done! Set up your public identity.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                    <label className="relative h-28 w-28 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden group cursor-pointer hover:border-brand transition-colors bg-card/40">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-3xl font-bold text-white">
                          {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                    <span className="text-xs text-muted-foreground">Upload photo</span>
                  </div>

                  <div className="w-full space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="h-11 w-full rounded-xl border border-border bg-card/40 px-4 text-sm outline-none focus:border-brand transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-muted-foreground font-medium">@</span>
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="johndoe_99"
                          className={`h-11 w-full rounded-xl border bg-card/40 pl-9 pr-10 text-sm outline-none transition-all ${
                            username
                              ? usernameAvailable === true
                                ? "border-emerald-500/50 focus:border-emerald-500"
                                : usernameAvailable === false
                                  ? "border-rose-500/50 focus:border-rose-500"
                                  : "border-border focus:border-brand"
                              : "border-border focus:border-brand"
                          }`}
                        />
                        {username && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {checkingUsername ? (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                            ) : usernameAvailable === true ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : usernameAvailable === false ? (
                              <X className="h-4 w-4 text-rose-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                      {username && usernameAvailable === false && (
                        <p className="text-xs text-rose-500 mt-1">Username is taken or invalid.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======= COMPLETION ANIMATION ======= */}
            {step === 6 && loading && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-brand/30 blur-2xl animate-pulse-glow" />
                  <div className="h-20 w-20 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow relative z-10 animate-float">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-gradient">Your AIRank workspace is ready.</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Personalizing your dashboard based on your preferences...
                </p>
                <div className="mt-8 flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          {!loading && (
            <div className="mt-10 pt-6 border-t border-border/50 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-brand px-8 text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!fullName || !username || usernameAvailable !== true}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-brand px-8 text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  Enter Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
