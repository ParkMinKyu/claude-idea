import { describe, it, expect } from 'vitest';
import { retentionCurve, pickAdSlot } from '../src/analytics.js';

describe('retentionCurve', () => {
  it('handles empty events', () => {
    expect(retentionCurve([])).toEqual([
      { mark: 0.25, ratio: 0 },
      { mark: 0.5, ratio: 0 },
      { mark: 0.75, ratio: 0 },
      { mark: 1.0, ratio: 0 },
    ]);
  });

  it('uses max progress per session', () => {
    const curve = retentionCurve([
      { sessionId: 'a', progressRatio: 0.4 },
      { sessionId: 'a', progressRatio: 0.9 },
      { sessionId: 'b', progressRatio: 0.3 },
      { sessionId: 'c', progressRatio: 1.0 },
    ]);
    // 3 sessions; a=0.9, b=0.3, c=1.0
    expect(curve.find((p) => p.mark === 0.25).ratio).toBeCloseTo(1.0);
    expect(curve.find((p) => p.mark === 0.5).ratio).toBeCloseTo(2 / 3);
    expect(curve.find((p) => p.mark === 1.0).ratio).toBeCloseTo(1 / 3);
  });
});

describe('pickAdSlot', () => {
  const slots = ['a', 'b', 'c'];

  it('returns null when no slots configured', () => {
    expect(pickAdSlot({ index: 4, slots: [] })).toBeNull();
  });
  it('skips index 0 and non-frequency indices', () => {
    expect(pickAdSlot({ index: 0, frequency: 4, slots })).toBeNull();
    expect(pickAdSlot({ index: 3, frequency: 4, slots })).toBeNull();
  });
  it('rotates through slots on hit indices', () => {
    expect(pickAdSlot({ index: 4, frequency: 4, slots })).toBe('a');
    expect(pickAdSlot({ index: 8, frequency: 4, slots })).toBe('b');
    expect(pickAdSlot({ index: 12, frequency: 4, slots })).toBe('c');
    expect(pickAdSlot({ index: 16, frequency: 4, slots })).toBe('a');
  });
  it('respects frequency cap', () => {
    expect(pickAdSlot({ index: 4, frequency: 4, slots, capPerHour: 1, impressionsLastHour: 1 })).toBeNull();
  });
});
