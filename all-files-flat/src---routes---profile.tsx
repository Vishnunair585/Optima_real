import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Bookmark, LogOut, Sparkles, LogIn, ChevronRight, Layers, ExternalLink } from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";
import { getStacksFn } from "../lib/api/stack.functions";

const PROMPT_LIBRARY = [
  { cat: "Coding", title: "Refactor with tests", body: "You are an expert software engineer..." },
  { cat: "Coding", title: "Bug detective", body: "You are a Senior Principal Security..." },
  { cat: "Research", title: "Source-cited summary", body: "You are an elite research analyst..." },
  { cat: "Research", title: "Steelman both sides", body: "Act as an unbiased philosophical analyst..." },
  { cat: "Marketing", title: "Landing page hero", body: "You are an elite conversion rate copywriter..." },
  { cat: "Marketing", title: "Cold email v2", body: "You are a B2B SaaS cold outbound expert..." },
  { cat: "Content", title: "Blog outline", body: "You are an expert SEO Content Strategist..." },
  { cat: "Content", title: "Twitter thread", body: "You are a viral content marketer..." },
  { cat: "Business", title: "Pricing memo", body: "You are a product management consultant..." },
  { cat: "Business", title: "Investor update", body: "You are a startup founder drafting..." },
  { cat: "Productivity", title: "Weekly review", body: "Act as an executive performance coach..." },
  { cat: "Productivity", title: "Meeting → action items", body: "You are an executive assistant..." },
];

type UserStack = Awaited<ReturnType<typeof getStacksFn>>[number];

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Optima" },
      { name: "description", content: "View your saved AI stacks, prompts, and profile settings." },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user, logout, updateAvatar } = useAuth();
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [myStacks, setMyStacks] = useState<UserStack[]>([]);
  const [bookmarkedStacks, setBookmarkedStacks] = useState<UserStack[]>([]);
  const [loadingStacks, setLoadingStacks] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("saved_prompts") ?? "[]");
        setSavedPrompts(stored);
      } catch {
        setSavedPrompts([]);
      }
    }
  }, [user]);

  useEffect(() => {
    async function loadStacks() {
      if (!user?.id) {
        setLoadingStacks(false);
        return;
      }
      setLoadingStacks(true);
      try {
        const [created, bookmarked] = await Promise.all([
          getStacksFn({ userId: user.id, limit: 50 }),
          getStacksFn({ savedByUserId: user.id, limit: 50 }),
        ]);
        setMyStacks(created);
        setBookmarkedStacks(bookmarked);
      } catch {
        setMyStacks([]);
        setBookmarkedStacks([]);
      } finally {
        setLoadingStacks(false);
      }
    }
    loadStacks();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-3xl glass p-8 text-center space-y-6">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-card border border-border text-muted-foreground shadow-glow">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sign in to view stats</h2>
            <p className="mt-2 text-sm text-muted-foreground">Log in to view your saved AI stacks and prompts.</p>
          </div>
          <Link to="/login" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow">
            <LogIn className="h-4 w-4" /> Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const savedPromptDetails = savedPrompts
    .map((title) => PROMPT_LIBRARY.find((p) => p.title === title))
    .filter(Boolean) as typeof PROMPT_LIBRARY;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-10 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-6">
          <div className="relative group shrink-0">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-3xl font-bold text-brand-foreground shadow-glow overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="opacity-80">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <span className="text-xs font-semibold text-white">Edit</span>
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-all self-start sm:self-center">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      {/* My Stacks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand" />
            My Saved Stacks ({myStacks.length})
          </h2>
          <Link to="/stack-builder" className="text-sm text-brand hover:underline font-medium">
            + Create new stack
          </Link>
        </div>

        {loadingStacks ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            Loading your stacks...
          </div>
        ) : myStacks.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {myStacks.map((stack) => (
              <Link
                key={stack.id}
                to={`/stacks/${stack.id}`}
                className="rounded-2xl glass p-5 flex flex-col gap-2 hover:bg-card/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm group-hover:text-brand transition-colors">{stack.name}</h3>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{stack.description || stack.goal}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {stack.category}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {stack.toolCount ?? stack.tools?.length ?? 0} tools
                  </span>
                  {!stack.is_public && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No stacks saved yet.{" "}
            <Link to="/stack-builder" className="text-brand hover:underline">Build your first AI stack</Link>.
          </div>
        )}
      </section>

      {/* Bookmarked Stacks */}
      {bookmarkedStacks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-brand" />
            Bookmarked Stacks ({bookmarkedStacks.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bookmarkedStacks.map((stack) => (
              <Link
                key={stack.id}
                to={`/stacks/${stack.id}`}
                className="rounded-2xl glass p-5 flex items-center justify-between hover:bg-card/60 transition-all"
              >
                <div>
                  <h3 className="font-semibold text-sm">{stack.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {stack.creator_name || "Community"} · {stack.toolCount ?? 0} tools
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Saved Prompts */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          My Saved Prompts ({savedPrompts.length})
        </h2>

        {savedPromptDetails.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {savedPromptDetails.map((prompt) => (
              <div key={prompt.title} className="rounded-2xl glass p-5 flex flex-col gap-2 hover:bg-card/60 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{prompt.title}</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {prompt.cat}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{prompt.body}</p>
                <Link to="/prompts" className="text-xs text-brand hover:underline mt-1 inline-flex items-center gap-1">
                  View in Prompt Library <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No prompts saved yet. Go to the <Link to="/prompts" className="text-brand hover:underline">Prompt Library</Link> to save some.
          </div>
        )}
      </section>
    </div>
  );
}
