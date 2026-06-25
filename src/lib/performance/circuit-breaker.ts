export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxRequests?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onHalfOpen?: () => void;
}

type CircuitState = "closed" | "open" | "half-open";

interface CircuitStateData {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  halfOpenRequests: number;
}

export class CircuitBreaker {
  private circuits = new Map<string, CircuitStateData>();
  private options: Map<string, CircuitBreakerOptions> = new Map();

  register(name: string, opts: CircuitBreakerOptions): void {
    this.options.set(name, opts);
    this.circuits.set(name, {
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      halfOpenRequests: 0,
    });
  }

  async call<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const opts = this.options.get(name);
    if (!opts) return fn();

    let state = this.circuits.get(name)!;
    const now = Date.now();

    if (state.state === "open") {
      if (now - state.lastFailureTime >= opts.timeoutMs) {
        state.state = "half-open";
        state.halfOpenRequests = 0;
        opts.onHalfOpen?.();
      } else {
        throw new Error(`Circuit breaker '${name}' is OPEN`);
      }
    }

    if (state.state === "half-open") {
      const maxRequests = opts.halfOpenMaxRequests ?? 1;
      if (state.halfOpenRequests >= maxRequests) {
        throw new Error(`Circuit breaker '${name}' is HALF-OPEN (limit reached)`);
      }
      state.halfOpenRequests++;
    }

    try {
      const result = await fn();
      state.successes++;
      state.failures = 0;

      if (state.state === "half-open" && state.successes >= opts.successThreshold) {
        state.state = "closed";
        state.successes = 0;
        state.halfOpenRequests = 0;
        opts.onClose?.();
      }

      return result;
    } catch (err) {
      state.failures++;
      state.successes = 0;
      state.lastFailureTime = now;

      if (state.failures >= opts.failureThreshold) {
        state.state = "open";
        opts.onOpen?.();
      }

      throw err;
    }
  }

  getState(name: string): CircuitState {
    return this.circuits.get(name)?.state ?? "closed";
  }

  getStats() {
    const stats: Record<string, { state: CircuitState; failures: number; successes: number }> = {};
    for (const [name, data] of this.circuits) {
      stats[name] = {
        state: data.state,
        failures: data.failures,
        successes: data.successes,
      };
    }
    return stats;
  }

  reset(name: string): void {
    const opts = this.options.get(name);
    if (opts) {
      this.circuits.set(name, {
        state: "closed",
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        halfOpenRequests: 0,
      });
    }
  }
}

export const circuitBreaker = new CircuitBreaker();
