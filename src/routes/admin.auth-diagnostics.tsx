import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "../components/auth/route-guard";
import { useAuth } from "../hooks/use-auth";
import { ShieldCheck, UserCheck, Key, RefreshCw, BadgeAlert } from "lucide-react";

export const Route = createFileRoute("/admin/auth-diagnostics")({
  head: () => ({
    meta: [
      { title: "Auth Diagnostics — Admin Panel" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <ProtectedRoute requireRole="Admin">
      <AuthDiagnosticsPage />
    </ProtectedRoute>
  ),
});

function AuthDiagnosticsPage() {
  const { user, session, isLoaded, isSignedIn, refreshSession } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/40 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-brand" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security & Auth Diagnostics</h1>
            <p className="text-sm text-muted-foreground">Admin panel to audit Supabase sessions and route state machine rules.</p>
          </div>
        </div>
        <button
          onClick={() => refreshSession()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-semibold hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Force Sync Session
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* State Indicators */}
        <div className="glass p-6 rounded-2xl border border-border space-y-4">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <UserCheck className="h-4.5 w-4.5 text-brand" /> Authentication Status
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Is Loaded</span>
              <span className="font-mono font-semibold text-emerald-400">{isLoaded ? "TRUE" : "FALSE"}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Is Signed In</span>
              <span className={`font-mono font-semibold ${isSignedIn ? "text-emerald-400" : "text-rose-400"}`}>
                {isSignedIn ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Email Verified Status</span>
              <span className={`font-mono font-semibold ${user?.email_verified ? "text-emerald-400" : "text-rose-400"}`}>
                {user?.email_verified ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Onboarding Complete</span>
              <span className={`font-mono font-semibold ${user?.onboarded ? "text-emerald-400" : "text-rose-400"}`}>
                {user?.onboarded ? "COMPLETED" : "INCOMPLETE"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Authorized System Role</span>
              <span className="font-mono font-semibold text-purple-400 uppercase">{user?.role || "USER"}</span>
            </div>
          </div>
        </div>

        {/* Token Details */}
        <div className="glass p-6 rounded-2xl border border-border space-y-4">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-brand" /> JWT Token Metadata
          </h3>

          {session ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Auth Provider</span>
                <span className="font-mono text-xs font-semibold capitalize text-foreground">
                  {session.user.app_metadata.provider || "Email"}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border/30 pb-2 flex-col gap-1">
                <span className="text-muted-foreground">Supabase User UID</span>
                <span className="font-mono text-[10px] break-all bg-card/60 p-1 rounded border border-border/30">
                  {session.user.id}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Token Expiration Time</span>
                <span className="font-mono text-xs text-foreground">
                  {new Date((session.expires_at || 0) * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs italic">
              No token session present on client.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
