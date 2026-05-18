import { describe, it, expect } from 'vitest';
import { distributeSubscriptionPool, singlePurchaseRoyalty } from '../src/royalty.js';

describe('distributeSubscriptionPool', () => {
  it('returns empty when pool is 0 or no listens', () => {
    expect(distributeSubscriptionPool({ poolKrw: 0, listens: [] }).size).toBe(0);
    expect(distributeSubscriptionPool({ poolKrw: 1000, listens: [] }).size).toBe(0);
  });

  it('splits pool proportionally to listen seconds', () => {
    const out = distributeSubscriptionPool({
      poolKrw: 1000,
      listens: [
        { authorId: 'a', seconds: 300 },
        { authorId: 'b', seconds: 100 },
      ],
    });
    expect(out.get('a')).toBe(750);
    expect(out.get('b')).toBe(250);
  });

  it('sum of payouts equals the payable pool exactly (rounding to top payee)', () => {
    const out = distributeSubscriptionPool({
      poolKrw: 1001, // makes rounding messy
      listens: [
        { authorId: 'a', seconds: 1 },
        { authorId: 'b', seconds: 1 },
        { authorId: 'c', seconds: 1 },
      ],
    });
    const sum = [...out.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBe(1001);
  });

  it('throws on bad input', () => {
    expect(() => distributeSubscriptionPool({ poolKrw: -1, listens: [] })).toThrow();
    expect(() => distributeSubscriptionPool({ poolKrw: 1, listens: null })).toThrow();
  });
});

describe('singlePurchaseRoyalty', () => {
  it('subtracts platform cut', () => {
    expect(singlePurchaseRoyalty({ priceKrw: 10000, platformCutRatio: 0.25 })).toBe(7500);
  });
  it('rejects invalid cut ratios', () => {
    expect(() => singlePurchaseRoyalty({ priceKrw: 1, platformCutRatio: 1 })).toThrow(RangeError);
    expect(() => singlePurchaseRoyalty({ priceKrw: 1, platformCutRatio: -0.1 })).toThrow();
  });
});
