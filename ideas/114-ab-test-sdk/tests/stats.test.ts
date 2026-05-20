import { describe, it, expect } from 'vitest';
import { analyze, twoTailedP, sampleSizePerArm } from '../src/lib/stats';

describe('twoTailedP', () => {
  it('z=0 gives p~1', () => {
    expect(twoTailedP(0)).toBeCloseTo(1, 2);
  });
  it('z=1.96 gives p~0.05', () => {
    expect(twoTailedP(1.96)).toBeCloseTo(0.05, 2);
  });
});

describe('analyze', () => {
  it('detects a significant uplift for a large clear difference', () => {
    const r = analyze({ conversions: 100, visitors: 1000 }, { conversions: 160, visitors: 1000 });
    expect(r.controlRate).toBeCloseTo(0.1, 5);
    expect(r.treatmentRate).toBeCloseTo(0.16, 5);
    expect(r.relativeUplift).toBeCloseTo(0.6, 5);
    expect(r.significant).toBe(true);
    expect(r.pValue).toBeLessThan(0.05);
  });

  it('is not significant for a tiny difference', () => {
    const r = analyze({ conversions: 100, visitors: 1000 }, { conversions: 102, visitors: 1000 });
    expect(r.significant).toBe(false);
    expect(r.pValue).toBeGreaterThan(0.05);
  });

  it('handles zero visitors without throwing', () => {
    const r = analyze({ conversions: 0, visitors: 0 }, { conversions: 0, visitors: 0 });
    expect(r.controlRate).toBe(0);
    expect(Number.isFinite(r.pValue)).toBe(true);
  });
});

describe('sampleSizePerArm', () => {
  it('requires more samples for smaller detectable effects', () => {
    const big = sampleSizePerArm(0.1, 0.05);
    const small = sampleSizePerArm(0.1, 0.01);
    expect(small).toBeGreaterThan(big);
    expect(big).toBeGreaterThan(0);
  });
});
