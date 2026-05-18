import { describe, it, expect } from 'vitest';
import { canIssueLicense, photoPayout, priceForTier, TIERS } from '../src/license.js';

const fullRelease = {
  allowsCommercial: true,
  allowsPolitical: true,
  allowsAdult: false,
  allowsResale: true,
};
const limitedRelease = {
  allowsCommercial: false,
  allowsPolitical: false,
  allowsAdult: false,
  allowsResale: false,
};

describe('priceForTier', () => {
  it('returns price for each known tier', () => {
    for (const t of TIERS) expect(priceForTier(t)).toBeGreaterThan(0);
  });
  it('throws on unknown tier', () => {
    expect(() => priceForTier('bogus')).toThrow();
  });
});

describe('canIssueLicense', () => {
  it('allows standard for limited release with non-commercial use', () => {
    expect(canIssueLicense({ tier: 'standard', modelRelease: limitedRelease, use: {} })).toBe(true);
  });

  it('blocks commercial when release disallows commercial', () => {
    expect(canIssueLicense({ tier: 'commercial', modelRelease: limitedRelease, use: {} })).toBe(false);
  });

  it('blocks extended unless release allows resale', () => {
    const release = { ...fullRelease, allowsResale: false };
    expect(canIssueLicense({ tier: 'extended', modelRelease: release, use: {} })).toBe(false);
  });

  it('blocks OOH use for standard tier', () => {
    expect(canIssueLicense({ tier: 'standard', modelRelease: fullRelease, use: { ooh: true } })).toBe(false);
  });

  it('blocks political use when release disallows it', () => {
    const release = { ...fullRelease, allowsPolitical: false };
    expect(canIssueLicense({ tier: 'commercial', modelRelease: release, use: { political: true } })).toBe(false);
  });
});

describe('photoPayout', () => {
  it('returns photographer + platform that sum to net', () => {
    const r = photoPayout({ saleKrw: 29000 });
    expect(r.photographer + r.platform).toBe(r.net);
    expect(r.net).toBeLessThanOrEqual(r.gross);
  });
  it('throws on negative sale', () => {
    expect(() => photoPayout({ saleKrw: -1 })).toThrow();
  });
});
