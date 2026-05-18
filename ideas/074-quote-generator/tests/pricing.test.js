import { describe, it, expect } from 'vitest';
import { templatePackPayout, podSalePrice, podBreakdown } from '../src/pricing.js';

describe('templatePackPayout', () => {
  it('splits 50/50 by default', () => {
    expect(templatePackPayout({ priceKrw: 5000 })).toEqual({ designer: 2500, platform: 2500 });
  });
  it('handles non-default ratio', () => {
    expect(templatePackPayout({ priceKrw: 10000, designerShareRatio: 0.7 })).toEqual({
      designer: 7000,
      platform: 3000,
    });
  });
  it('rejects out-of-range ratio', () => {
    expect(() => templatePackPayout({ priceKrw: 1, designerShareRatio: 1.1 })).toThrow();
    expect(() => templatePackPayout({ priceKrw: 1, designerShareRatio: -1 })).toThrow();
  });
});

describe('podSalePrice', () => {
  it('marks up base cost by margin and rounds to nearest 100', () => {
    const p = podSalePrice({ productType: 'poster', marginRatio: 0.2 });
    // 9000 / 0.8 = 11250 -> ceil to 11300
    expect(p).toBe(11300);
    expect(p % 100).toBe(0);
  });

  it('throws on unknown product', () => {
    expect(() => podSalePrice({ productType: 'mug' })).toThrow();
  });

  it('rejects margin >= 0.9', () => {
    expect(() => podSalePrice({ productType: 'postcard', marginRatio: 0.95 })).toThrow();
  });
});

describe('podBreakdown', () => {
  it('returns sale, cost, margin sum identity', () => {
    const b = podBreakdown({ productType: 'tshirt', marginRatio: 0.3 });
    expect(b.sale).toBeGreaterThan(b.cost);
    expect(b.sale - b.cost).toBe(b.margin);
  });
});
