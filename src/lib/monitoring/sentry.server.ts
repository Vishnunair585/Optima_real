import * as Sentry from "@sentry/node";

export function initSentryBackend() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

export function captureBackendError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setTag("source", "backend");
    Sentry.captureException(error);
  });
}

export function captureApiError(error: Error, method: string, path: string, userId?: string) {
  Sentry.withScope((scope) => {
    scope.setTag("source", "api");
    scope.setTag("method", method);
    scope.setTag("path", path);
    if (userId) scope.setUser({ id: userId });
    Sentry.captureException(error);
  });
}

export { Sentry };
