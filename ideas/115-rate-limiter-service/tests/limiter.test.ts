import { describe, it, expect } from 'vitest';
import { TokenBucketLimiter, SlidingWindowLimiter } from '../src/lib/limiter';

// Controllable clock helper.
function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; } };
}

describe('TokenBucketLimiter', () => {
  it('allows up to capacity then blocks', () => {
    const c = clock();
    const l = new TokenBucketLimiter({ capacity: 3, refillPerSec: 1, now: c.now });
    expect(l.consume('k').allowed).toBe(true);
    expect(l.consume('k').allowed).toBe(true);
    expect(l.consume('k').allowed).toBe(true);
    const blocked = l.consume('k');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('refills over time', () => {
    const c = clock();
    const l = new TokenBucketLimiter({ capacity: 2, refillPerSec: 1, now: c.now });
    l.consume('k'); l.consume('k');
    expect(l.consume('k').allowed).toBe(false);
    c.advance(1000); // +1 token
    expect(l.consume('k').allowed).toBe(true);
    expect(l.consume('k').allowed).toBe(false);
  });

  it('isolates keys', () => {
    const c = clock();
    const l = new TokenBucketLimiter({ capacity: 1, refillPerSec: 1, now: c.now });
    expect(l.consume('a').allowed).toBe(true);
    expect(l.consume('b').allowed).toBe(true); // different key, own bucket
    expect(l.consume('a').allowed).toBe(false);
  });

  it('does not exceed capacity when idle for long', () => {
    const c = clock();
    const l = new TokenBucketLimiter({ capacity: 3, refillPerSec: 10, now: c.now });
    l.consume('k');
    c.advance(60_000); // huge idle
    const r = l.consume('k');
    expect(r.remaining).toBeLessThanOrEqual(2); // capacity-1, never above capacity
  });
});

describe('SlidingWindowLimiter', () => {
  it('limits requests within the window', () => {
    const c = clock();
    const l = new SlidingWindowLimiter({ limit: 2, windowMs: 1000, now: c.now });
    expect(l.consume('k').allowed).toBe(true);
    expect(l.consume('k').allowed).toBe(true);
    expect(l.consume('k').allowed).toBe(false);
  });

  it('frees up capacity as old hits leave the window', () => {
    const c = clock();
    const l = new SlidingWindowLimiter({ limit: 2, windowMs: 1000, now: c.now });
    l.consume('k'); // t=0
    c.advance(500);
    l.consume('k'); // t=500
    expect(l.consume('k').allowed).toBe(false);
    c.advance(600); // t=1100, first hit (t=0) now outside window
    expect(l.consume('k').allowed).toBe(true);
  });

  it('reports retryAfterMs when blocked', () => {
    const c = clock();
    const l = new SlidingWindowLimiter({ limit: 1, windowMs: 1000, now: c.now });
    l.consume('k');
    const r = l.consume('k');
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
    expect(r.retryAfterMs).toBeLessThanOrEqual(1000);
  });
});
