import * as Sentry from "@sentry/react";
import { browserTracingIntegration } from "@sentry/react";

export function initSentryFrontend() {
  const dsn = process.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VITE_APP_ENV || "development",
    integrations: [browserTracingIntegration()],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (process.env.VITE_APP_ENV === "development") {
        console.debug("[Sentry] Would send:", event.exception?.values?.[0]?.value);
        return null;
      }
      return event;
    },
  });
}

export function setSentryUser(userId?: string | null, email?: string | null) {
  if (userId) {
    Sentry.setUser({ id: userId, email: email || undefined });
  } else {
    Sentry.setUser(null);
  }
}

export function captureFrontendError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setTag("source", "frontend");
    Sentry.captureException(error);
  });
}

export { Sentry };
