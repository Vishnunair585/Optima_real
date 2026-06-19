import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Flame, Coins, Trophy, LogOut, Bookmark, Sparkles, LogIn, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Optima" },
      { name: "description", content: "View your Optima developer stats, claim daily credits, and view saved prompts." },
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

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-3xl glass p-8 text-center space-y-6">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-card border border-border text-muted-foreground shadow-glow">
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sign in to view stats</h2>
            <p className="mt-2 text-sm text-muted-foreground">Log in to track your daily streak, claim developer credits, and view saved AI stacks.</p>
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 animate-fade-up">
      {/* Profile Header */}
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



      {/* Saved items list */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-brand" />
          My Saved Prompts ({savedPrompts.length})
        </h2>

        {savedPrompts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {savedPrompts.map((title) => (
              <div key={title} className="rounded-2xl glass p-5 flex items-center justify-between hover:bg-card/60 transition-all">
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Prompt saved to clipboard pool</p>
                </div>
                <Link to="/prompts" className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                  <ChevronRight className="h-4 w-4" />
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
