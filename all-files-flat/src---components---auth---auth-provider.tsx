import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import {
  signUpFn,
  loginFn,
  logoutFn,
  getSessionFn,
  requestPasswordResetFn,
  resetPasswordFn,
  updateAvatarFn
} from "../../lib/api/auth.functions";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
  email_verified: boolean;
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password?: string, username?: string) => Promise<boolean>;
  logout: () => void;
  sendResetLink: (email: string) => Promise<boolean>;
  resetPassword: (password: string, token: string) => Promise<boolean>;
  updateAvatar: (avatarBase64: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;

  // OAuth methods
  loginWithGoogle: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  loginWithX: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getOAuthRedirectUrl(provider: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth-callback?redirect=${encodeURIComponent(window.location.pathname)}`;
}

async function initiateOAuth(provider: string) {
  const { getOAuthUrlFn } = await import("../../lib/api/auth.functions");
  const result = await getOAuthUrlFn({ data: { provider, redirectTo: getOAuthRedirectUrl(provider) } });
  if (result.url) {
    window.location.href = result.url;
    return true;
  }
  throw new Error(`${provider} authentication is not configured.`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSession = async () => {
    try {
      const session = await getSessionFn();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to get session", error);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password is required");
    try {
      await loginFn({ data: { email, password } });
      await fetchSession();
      toast.success("Welcome back!");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    }
  };

  const signUp = async (email: string, password?: string, username?: string) => {
    if (!password) throw new Error("Password is required");
    if (!username) throw new Error("Username is required");
    try {
      const { getStoredReferralCode } = await import("../../lib/referral/constants");
      const referralCode = getStoredReferralCode() || undefined;
      let fingerprint: string | undefined;
      try {
        fingerprint = typeof navigator !== "undefined"
          ? `${navigator.userAgent.slice(0, 80)}|${screen.width}x${screen.height}`
          : undefined;
      } catch {
        fingerprint = undefined;
      }
      const result = await signUpFn({ data: { email, password, username, referralCode, fingerprint } });

      // Send OTP verification email after signup
      try {
        const { sendVerificationEmailFn } = await import("../../lib/api/auth.functions");
        await sendVerificationEmailFn({ data: { email, userId: result.userId } });
      } catch {
        // Verification email sending is best-effort
      }

      await fetchSession();
      toast.success("Account created! Check your email for the OTP code.");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Sign up failed");
    }
  };

  const logout = async () => {
    try {
      await logoutFn();
      setUser(null);
      toast.success("Logged out successfully.");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  const sendResetLink = async (email: string) => {
    try {
      await requestPasswordResetFn({ data: { email } });
      toast.success("Password reset link sent! Check your email.");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Failed to send reset link");
    }
  };

  const resetPassword = async (password: string, token: string) => {
    try {
      await resetPasswordFn({ data: { password, token } });
      toast.success("Password reset successfully! You can now log in.");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Failed to reset password");
    }
  };

  const updateAvatar = async (avatarBase64: string) => {
    try {
      await updateAvatarFn({ data: { avatar: avatarBase64 } });
      await fetchSession();
      toast.success("Profile picture updated!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile picture");
      return false;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const { verifyEmailWithOtpFn } = await import("../../lib/api/auth.functions");
      const result = await verifyEmailWithOtpFn({ data: { email, otp } });
      if (result.success) {
        await fetchSession();
        toast.success("Email verified successfully!");
        return true;
      }
      toast.error(result.reason || "Invalid OTP.");
      return false;
    } catch (err: any) {
      toast.error(err.message || "Verification failed.");
      return false;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const { resendVerificationEmailFn } = await import("../../lib/api/auth.functions");
      await resendVerificationEmailFn({ data: { email } });
      toast.success("New OTP sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP.");
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  const loginWithGoogle = async () => initiateOAuth("google");
  const loginWithGitHub = async () => initiateOAuth("github");
  const loginWithX = async () => initiateOAuth("twitter");
  const loginWithApple = async () => { toast.info("Apple login coming soon"); return false; };

  return (
    <AuthContext.Provider value={{
      user,
      isLoaded,
      isSignedIn: !!user,
      login,
      signUp,
      logout,
      sendResetLink,
      resetPassword,
      updateAvatar,
      verifyOtp,
      resendOtp,
      refreshSession,
      loginWithGoogle,
      loginWithGitHub,
      loginWithX,
      loginWithApple,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
