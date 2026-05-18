// Royalty + margin calculator for template packs and POD orders.

export function templatePackPayout({ priceKrw, designerShareRatio = 0.5 }) {
  if (!(priceKrw >= 0)) throw new TypeError('priceKrw must be >= 0');
  if (designerShareRatio < 0 || designerShareRatio > 1) {
    throw new RangeError('designerShareRatio must be in [0, 1]');
  }
  const designer = Math.floor(priceKrw * designerShareRatio);
  const platform = priceKrw - designer;
  return { designer, platform };
}

const POD_BASE_COST = {
  postcard: 1500, // KRW: print + ship base cost
  poster: 9000,
  tshirt: 8500,
};

export function podSalePrice({ productType, marginRatio = 0.2 }) {
  const base = POD_BASE_COST[productType];
  if (!Number.isFinite(base)) throw new Error(`unknown POD product: ${productType}`);
  if (marginRatio < 0 || marginRatio >= 0.9) {
    throw new RangeError('marginRatio out of range');
  }
  // Sale = base / (1 - margin), round up to nearest 100 won.
  const raw = base / (1 - marginRatio);
  return Math.ceil(raw / 100) * 100;
}

export function podBreakdown({ productType, marginRatio = 0.2 }) {
  const sale = podSalePrice({ productType, marginRatio });
  const cost = POD_BASE_COST[productType];
  return { sale, cost, margin: sale - cost };
}
