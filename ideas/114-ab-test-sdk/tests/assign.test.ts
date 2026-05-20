import { describe, it, expect } from 'vitest';
import { assign, hashToUnit, ExperimentClient, type Experiment } from '../src/lib/assign';

const ab: Experiment = {
  key: 'cta-color',
  variants: [{ key: 'control', weight: 1 }, { key: 'treatment', weight: 1 }],
};

describe('hashToUnit', () => {
  it('returns a value in [0, 1)', () => {
    for (const s of ['a', 'b', 'longer-seed-value', '']) {
      const u = hashToUnit(s);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });
});

describe('assign', () => {
  it('is deterministic for the same unit', () => {
    const a = assign(ab, 'user-42');
    const b = assign(ab, 'user-42');
    expect(a.variant).toBe(b.variant);
  });

  it('splits a 50/50 experiment roughly evenly', () => {
    let control = 0;
    const N = 5000;
    for (let i = 0; i < N; i += 1) {
      if (assign(ab, `user-${i}`).variant === 'control') control += 1;
    }
    const ratio = control / N;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });

  it('respects weighting (90/10)', () => {
    const weighted: Experiment = {
      key: 'weighted',
      variants: [{ key: 'a', weight: 9 }, { key: 'b', weight: 1 }],
    };
    let a = 0;
    const N = 5000;
    for (let i = 0; i < N; i += 1) if (assign(weighted, `u${i}`).variant === 'a') a += 1;
    const ratio = a / N;
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(0.95);
  });

  it('honors traffic allocation (only ~30% enrolled)', () => {
    const allocated: Experiment = { ...ab, key: 'alloc', allocation: 0.3 };
    let enrolled = 0;
    const N = 5000;
    for (let i = 0; i < N; i += 1) if (assign(allocated, `u${i}`).enrolled) enrolled += 1;
    const ratio = enrolled / N;
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.35);
  });

  it('client returns null for unknown experiments', () => {
    const c = new ExperimentClient([ab]);
    expect(c.getVariant('nope', 'u1')).toBeNull();
    expect(['control', 'treatment']).toContain(c.getVariant('cta-color', 'u1'));
  });
});
