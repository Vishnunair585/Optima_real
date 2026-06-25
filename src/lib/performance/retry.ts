const retryStore = new Map<string, { attempts: number; nextRetry: number }>();

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBackoff: true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
  operationKey?: string,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= (opts.maxRetries ?? 3); attempt++) {
    try {
      if (attempt > 0 && operationKey) {
        const record = retryStore.get(operationKey);
        if (record && Date.now() < record.nextRetry) {
          await new Promise((r) => setTimeout(r, record.nextRetry - Date.now()));
        }
      }
      const result = await fn();
      if (operationKey) retryStore.delete(operationKey);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < (opts.maxRetries ?? 3)) {
        const delay = opts.exponentialBackoff
          ? Math.min((opts.baseDelayMs ?? 1000) * Math.pow(2, attempt), opts.maxDelayMs ?? 30000)
          : opts.baseDelayMs ?? 1000;
        if (operationKey) {
          retryStore.set(operationKey, { attempts: attempt + 1, nextRetry: Date.now() + delay });
        }
        opts.onRetry?.(attempt + 1, lastError);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error("Retry failed");
}

export function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch(() => fallback);
}

export function clearRetryState(key?: string): void {
  if (key) retryStore.delete(key);
  else retryStore.clear();
}

export function getRetryState(key: string): { attempts: number; nextRetry: number } | undefined {
  return retryStore.get(key);
}
