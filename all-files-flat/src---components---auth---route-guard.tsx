import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/use-auth";

export function ProtectedRoute({ children, requireRole }: { children: ReactNode, requireRole?: string }) {
  const { isLoaded, isSignedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      navigate({ to: "/login", search: { redirect: location.pathname } });
    } else if (user && !user.email_verified) {
      navigate({ to: "/verify-email" });
    } else if (user && !user.onboarded && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    } else if (requireRole && user?.role !== requireRole) {
      navigate({ to: "/dashboard" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, requireRole, user]);

  if (!isLoaded || !isSignedIn || (user && !user.email_verified) || (user && !user.onboarded) || (requireRole && user?.role !== requireRole)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  return <>{children}</>;
}
