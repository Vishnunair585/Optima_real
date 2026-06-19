import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute('/auth-callback')({
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        try {
          if (typeof (supabase.auth as any).getSessionFromUrl === "function") {
            // @ts-ignore
            await supabase.auth.getSessionFromUrl({ storeSession: true });
          }
        } catch (e) {
          console.warn("Supabase getSessionFromUrl unavailable or failed", e);
        }

        await refreshSession();

        const sessionResult = await supabase.auth.getSession();
        const user = sessionResult?.data?.session?.user;
        if (!user) {
          toast.error("Authentication failed.");
          navigate({ to: "/login" });
          return;
        }

        const emailVerified = Boolean(
          (user as any)?.email_confirmed_at ||
          (user as any)?.email_confirmed ||
          (user as any)?.email_verified_at ||
          (user as any)?.confirmed_at,
        );
        const onboarded = (user as any)?.user_metadata?.onboarded || false;
        const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;

        if (!emailVerified) {
          navigate({ to: "/verify-email" });
        } else if (!onboarded) {
          navigate({ to: "/onboarding" });
        } else if (safeRedirect) {
          navigate({ to: safeRedirect });
        } else {
          navigate({ to: "/dashboard" });
        }
      } catch (err: any) {
        toast.error(err.message || "OAuth callback failed");
        navigate({ to: "/login" });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, refreshSession]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  return null;
}
