import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    if (typeof window !== "undefined") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return (this.props.fallback as (error: Error, reset: () => void) => ReactNode)(
          this.state.error!,
          this.reset,
        );
      }
      return (
        this.props.fallback || (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-red-800/50 bg-red-900/10 p-8 text-center">
            <div className="mb-3 text-4xl">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">Something went wrong</h3>
            <p className="mb-4 max-w-md text-sm text-gray-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.reset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}

interface SuspenseErrorProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
}

export function SuspenseWithError({ children, fallback, errorFallback }: SuspenseErrorProps) {
  return (
    <React.Suspense fallback={fallback || <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>}>
      <ErrorBoundary fallback={errorFallback}>
        {children}
      </ErrorBoundary>
    </React.Suspense>
  );
}
