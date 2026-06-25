import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { PublicOnlyRoute } from "../components/auth/route-guard";
import { OptimaLogo } from "../components/site/OptimaLogo";
import { Loader2, AlertCircle, Check, ArrowLeft, Mail } from "lucide-react";

function ForgotPasswordRoute() {
  return (
    <PublicOnlyRoute>
      <ForgotPasswordPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
});

function ForgotPasswordPage() {
  const { sendResetLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      await sendResetLink(email);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset link.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <OptimaLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Enter your email and we'll send you a reset link</p>
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
                <h3 className="font-semibold text-lg">Check your inbox</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="h-4 w-4" /> Send Reset Link</>
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
