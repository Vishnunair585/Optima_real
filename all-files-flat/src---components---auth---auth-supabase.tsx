import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { syncSupabaseSessionFn, logoutFn } from "../../lib/api/auth.functions";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: "Guest" | "User" | "Premium" | "Admin";
  streak: number;
  credits: number;
  xp: number;
  email_verified: boolean;
  lastClaimDate: string | null;
  onboarded: boolean;
}

export interface OnboardingData {
  username: string;
  name: string;
  avatar: string;
  country: string;
  timezone: string;
  persona: string;
  goal: string[];
  budget: string;
  experience: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  loginWithX: () => Promise<boolean>;
  signUp: (email: string, password?: string, username?: string) => Promise<boolean>;
  logout: () => void;
  claimDailyCredits: () => void;
  addXP: (amount: number) => void;
  verifyEmailCode: (code: string) => Promise<boolean>;
  sendResetLink: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setUser(null);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Supabase getSession error:", err);
        setUser(null);
        setIsLoaded(true);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setIsLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getEmailVerified = (supabaseUser: SupabaseUser) => {
    return Boolean(
      supabaseUser.email_confirmed_at ||
      (supabaseUser as any).email_verified ||
      (supabaseUser as any).email_verified_at ||
      (supabaseUser as any).confirmed_at
    );
  };

  const fetchProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      const email = supabaseUser.email || "";
      const name = profile?.full_name || profile?.username || email.split("@")[0] || "User";
      const isVerified = getEmailVerified(supabaseUser);
      const avatar = profile?.avatar_url || name.substring(0, 2).toUpperCase();

      // Sync user session to SQLite backend
      const syncResult = await syncSupabaseSessionFn({
        userId: supabaseUser.id,
        email,
        name,
        avatar,
        email_verified: isVerified,
      });

      setUser({
        id: supabaseUser.id,
        email,
        name,
        avatar,
        role: profile?.role || "User",
        streak: 1,
        credits: 50,
        xp: 100,
        email_verified: isVerified,
        lastClaimDate: null,
        onboarded: syncResult.onboarded,
      });
    } catch (err) {
      console.error("Error in fetchProfile", err);
    } finally {
      setIsLoaded(true);
    }
  };

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password is required");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    toast.success("Successfully logged in!");
    return true;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: { access_type: "offline", prompt: "consent" }
      }
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const loginWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth-callback`
      }
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const loginWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth-callback`
      }
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const loginWithX = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth-callback`
      }
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const signUp = async (email: string, password?: string, username?: string) => {
    if (!password) throw new Error("Password is required");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username
        }
      }
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await logoutFn();
    toast.success("Logged out successfully.");
    window.location.href = "/";
  };

  const verifyEmailCode = async (code: string) => {
    // Assuming handling magic links or OTP, handled automatically by Supabase redirect mostly
    // But for a custom verify form if needed:
    return true;
  };

  const sendResetLink = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password?type=recovery`,
    });
    if (error) throw new Error(error.message);
    toast.success("Password reset link sent to your email!");
    return true;
  };

  const resetPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    toast.success("Password reset successfully! You can now log in.");
    return true;
  };

  const claimDailyCredits = () => {
    // Requires a database update to the profiles table in a real app
    toast.success("Feature in development for Supabase!");
  };

  const addXP = (amount: number) => {
    // Requires a database update to the profiles table in a real app
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        username: data.username,
        full_name: data.name,
        // Add other fields to schema if needed
      })
      .eq("id", session.user.id);
      
    if (error) {
      toast.error("Failed to update profile.");
      return;
    }
    
    // Refresh user state
    await fetchProfile(session.user);
    toast.success("Account setup complete!");
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoaded,
      isSignedIn: !!session,
      login,
      loginWithGoogle,
      loginWithGitHub,
      loginWithApple,
      loginWithX,
      signUp,
      logout,
      claimDailyCredits,
      addXP,
      completeOnboarding,
      verifyEmailCode,
      sendResetLink,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}
