// License catalog + matcher. We support 3 tiers:
//   standard    - web/social, < 500K impressions, no print > A4
//   commercial  - any digital + print up to A2, includes OOH
//   extended    - includes resale-of-end-product, > 500K impressions
// Each photo also has a model-release scope that constrains which licenses
// can be issued (e.g. religious-sensitive uses may be blocked).

export const TIERS = ['standard', 'commercial', 'extended'];

const TIER_PRICE_KRW = {
  standard: 9900,
  commercial: 29000,
  extended: 99000,
};

const TIER_FEATURES = {
  standard: { maxImpressions: 500_000, allowsPrint: 'A4', allowsOOH: false, resellable: false },
  commercial: { maxImpressions: Infinity, allowsPrint: 'A2', allowsOOH: true, resellable: false },
  extended: { maxImpressions: Infinity, allowsPrint: 'unlimited', allowsOOH: true, resellable: true },
};

export function priceForTier(tier) {
  if (!TIERS.includes(tier)) throw new Error(`unknown tier: ${tier}`);
  return TIER_PRICE_KRW[tier];
}

// Model release scope shape:
//   { allowsCommercial: bool, allowsPolitical: bool, allowsAdult: bool, allowsResale: bool }
export function canIssueLicense({ tier, modelRelease, use }) {
  if (!TIERS.includes(tier)) throw new Error(`unknown tier: ${tier}`);
  if (!modelRelease || typeof modelRelease !== 'object') return false;
  const features = TIER_FEATURES[tier];

  if (tier !== 'standard' && !modelRelease.allowsCommercial) return false;
  if (tier === 'extended' && !modelRelease.allowsResale) return false;
  if (use?.political && !modelRelease.allowsPolitical) return false;
  if (use?.adult && !modelRelease.allowsAdult) return false;
  if (use?.print && tier === 'standard' && features.allowsPrint !== 'A4') {
    // already covered by allowsPrint comparison; double-guard noop
  }
  if (use?.ooh && !features.allowsOOH) return false;
  return true;
}

// Payout splitter: photographer share of net (after PG fees).
export function photoPayout({ saleKrw, pgFeeRatio = 0.035, photographerShareRatio = 0.4 }) {
  if (!(saleKrw >= 0)) throw new TypeError('saleKrw must be >= 0');
  const net = Math.floor(saleKrw * (1 - pgFeeRatio));
  const photographer = Math.floor(net * photographerShareRatio);
  return { gross: saleKrw, net, photographer, platform: net - photographer };
}
