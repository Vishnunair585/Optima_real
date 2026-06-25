import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { PublicOnlyRoute } from "../components/auth/route-guard";
import { OptimaLogo } from "../components/site/OptimaLogo";
import { Eye, EyeOff, Loader2, AlertCircle, Check, ArrowLeft } from "lucide-react";

function ResetPasswordRoute() {
  return (
    <PublicOnlyRoute>
      <ResetPasswordPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRoute,
});

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      setStatus("error");
      return;
    }

    try {
      await resetPassword(password, token);
      setStatus("success");
      setTimeout(() => navigate({ to: "/login", search: { reset: "true" } }), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
      setStatus("error");
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
        <div className="w-full max-w-[420px] text-center space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 shadow-elegant">
            <AlertCircle className="h-10 w-10 mx-auto text-rose-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground mb-6">This password reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <OptimaLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create new password</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Enter your new password below</p>
        </div>

        {status === "error" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-elegant">
          {status === "success" ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Password reset successful</h3>
                <p className="text-sm text-muted-foreground mt-1">Redirecting you to sign in...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full h-11 pl-3.5 pr-10 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm new password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
