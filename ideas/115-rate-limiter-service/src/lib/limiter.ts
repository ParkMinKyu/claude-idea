// Rate limiting algorithms: token bucket and sliding window log.
// Pure / injectable-clock design so behavior is fully testable offline.

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  // Milliseconds until the next request would be allowed (0 if allowed now).
  retryAfterMs: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number; // ms
}

export interface TokenBucketOptions {
  capacity: number; // max tokens
  refillPerSec: number; // tokens added per second
  now?: () => number; // injectable clock (ms)
}

export class TokenBucketLimiter {
  private capacity: number;
  private refillPerSec: number;
  private now: () => number;
  private states = new Map<string, BucketState>();

  constructor(opts: TokenBucketOptions) {
    this.capacity = opts.capacity;
    this.refillPerSec = opts.refillPerSec;
    this.now = opts.now ?? (() => Date.now());
  }

  private refill(state: BucketState, ts: number): void {
    const elapsedSec = (ts - state.lastRefill) / 1000;
    if (elapsedSec <= 0) return;
    state.tokens = Math.min(this.capacity, state.tokens + elapsedSec * this.refillPerSec);
    state.lastRefill = ts;
  }

  consume(key: string, cost = 1): LimitResult {
    const ts = this.now();
    let state = this.states.get(key);
    if (!state) {
      state = { tokens: this.capacity, lastRefill: ts };
      this.states.set(key, state);
    }
    this.refill(state, ts);

    if (state.tokens >= cost) {
      state.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(state.tokens),
        limit: this.capacity,
        retryAfterMs: 0,
      };
    }
    const deficit = cost - state.tokens;
    const retryAfterMs = Math.ceil((deficit / this.refillPerSec) * 1000);
    return {
      allowed: false,
      remaining: Math.floor(state.tokens),
      limit: this.capacity,
      retryAfterMs,
    };
  }

  reset(key: string): void {
    this.states.delete(key);
  }
}

export interface SlidingWindowOptions {
  limit: number; // max requests
  windowMs: number; // window size in ms
  now?: () => number;
}

// Sliding window log: stores timestamps and prunes those outside the window.
export class SlidingWindowLimiter {
  private limit: number;
  private windowMs: number;
  private now: () => number;
  private hits = new Map<string, number[]>();

  constructor(opts: SlidingWindowOptions) {
    this.limit = opts.limit;
    this.windowMs = opts.windowMs;
    this.now = opts.now ?? (() => Date.now());
  }

  consume(key: string): LimitResult {
    const ts = this.now();
    const cutoff = ts - this.windowMs;
    const log = (this.hits.get(key) ?? []).filter((t) => t > cutoff);

    if (log.length < this.limit) {
      log.push(ts);
      this.hits.set(key, log);
      return {
        allowed: true,
        remaining: this.limit - log.length,
        limit: this.limit,
        retryAfterMs: 0,
      };
    }
    this.hits.set(key, log);
    const oldest = log[0];
    const retryAfterMs = Math.max(0, oldest + this.windowMs - ts);
    return { allowed: false, remaining: 0, limit: this.limit, retryAfterMs };
  }

  reset(key: string): void {
    this.hits.delete(key);
  }
}
