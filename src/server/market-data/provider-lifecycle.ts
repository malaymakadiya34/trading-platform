import { withRetry } from "./retry.ts";
export type ProviderConnectionState =
  | "NOT_CONFIGURED"
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "RATE_LIMITED"
  | "FAILED";
export type ProviderLifecycleSnapshot = {
  state: ProviderConnectionState;
  provider: string;
  changedAt: Date;
  attempt: number;
  error: string | null;
};
export type ProviderLifecycleAdapter = {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
};
export class RateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super("Market-data provider rate limit reached");
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}
export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;
  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }
  consume(now = Date.now()) {
    this.timestamps = this.timestamps.filter((value) => now - value < this.windowMs);
    if (this.timestamps.length >= this.limit)
      throw new RateLimitError(Math.max(0, this.windowMs - (now - this.timestamps[0])));
    this.timestamps.push(now);
  }
}
export class ProviderLifecycle {
  private snapshotValue: ProviderLifecycleSnapshot;
  private listeners = new Set<(snapshot: ProviderLifecycleSnapshot) => void>();
  private readonly adapter: ProviderLifecycleAdapter;
  private readonly options: { attempts: number; delayMs: number };
  constructor(adapter: ProviderLifecycleAdapter, options = { attempts: 5, delayMs: 500 }) {
    this.adapter = adapter;
    this.options = options;
    this.snapshotValue = {
      state: "DISCONNECTED",
      provider: adapter.name,
      changedAt: new Date(),
      attempt: 0,
      error: null,
    };
  }
  get snapshot() {
    return { ...this.snapshotValue };
  }
  onChange(listener: (snapshot: ProviderLifecycleSnapshot) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private transition(state: ProviderConnectionState, attempt: number, error: string | null = null) {
    this.snapshotValue = {
      state,
      provider: this.adapter.name,
      changedAt: new Date(),
      attempt,
      error,
    };
    for (const listener of this.listeners) listener(this.snapshot);
  }
  async connect() {
    this.transition("CONNECTING", 0);
    let attempt = 0;
    try {
      await withRetry(
        async () => {
          attempt += 1;
          if (attempt > 1) this.transition("RECONNECTING", attempt);
          await this.adapter.connect();
        },
        { attempts: this.options.attempts, delayMs: this.options.delayMs },
      );
      this.transition("CONNECTED", attempt);
    } catch (error) {
      this.transition(
        error instanceof RateLimitError ? "RATE_LIMITED" : "FAILED",
        attempt,
        error instanceof Error ? error.message : "Provider connection failed",
      );
      throw error;
    }
  }
  async reconnect() {
    await this.disconnect();
    await this.connect();
  }
  async disconnect() {
    try {
      await this.adapter.disconnect();
    } finally {
      this.transition("DISCONNECTED", 0);
    }
  }
  fail(error: unknown) {
    this.transition(
      "FAILED",
      this.snapshotValue.attempt,
      error instanceof Error ? error.message : "Provider failure",
    );
  }
}
