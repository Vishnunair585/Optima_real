import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";
import { Mail, RefreshCw, LogOut, CheckCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { user, isLoaded, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate({ to: "/login" });
    }
    if (isLoaded && user?.email_verified) {
      navigate({ to: user.onboarded ? "/dashboard" : "/onboarding" });
    }
  }, [user, isLoaded, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshSession();
      // Wait a moment for state update
      setTimeout(() => {
        if (user?.email_verified) {
          toast.success("Email verified successfully! Redirecting...");
        } else {
          toast.info("Verification link not clicked yet. Please check your inbox.");
        }
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "Failed to check status.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`,
        }
      });
      if (error) throw error;
      toast.success("Verification email resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification link.");
    } finally {
      setResending(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl glass p-8 text-center space-y-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 border border-brand/20 text-brand shadow-glow">
          <Mail className="h-8 w-8" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Please verify your email</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>. 
            Click the link in the email to verify your account, then click check status below.
          </p>
        </div>

        <div className="pt-4 border-t border-border/50 space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Check Verification Status
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card/40 text-sm font-semibold hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
          >
            {resending ? "Sending..." : "Resend Verification Link"}
          </button>

          <button
            onClick={() => logout()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
