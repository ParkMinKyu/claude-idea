// Coupon aggregator MVP — HTML parsing, vote scoring, affiliate link
// rewriting, and notification matching.

// Extract coupons from a normalized HTML string using a simple regex pattern.
// Real scrapers should use Cheerio with store-specific selectors.
export function parseCouponsFromText(text, storeId) {
  const codeRe = /\b([A-Z0-9]{4,16})\b\s*(?:[-—:]\s*)?([0-9]{1,2})%\s*(?:off|할인)/gi;
  const found = [];
  let m;
  while ((m = codeRe.exec(text))) {
    found.push({
      storeId,
      code: m[1].toUpperCase(),
      discount: { type: "percent", value: Number(m[2]) },
      foundAt: new Date().toISOString(),
    });
  }
  return dedupeByCode(found);
}

function dedupeByCode(arr) {
  const seen = new Set();
  return arr.filter((c) => {
    const k = `${c.storeId}|${c.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Combine fresh scrape with existing records, preserving votes/seenAt.
export function mergeCoupons(existing, incoming) {
  const byKey = new Map(existing.map((c) => [`${c.storeId}|${c.code}`, c]));
  for (const inc of incoming) {
    const k = `${inc.storeId}|${inc.code}`;
    const prev = byKey.get(k);
    if (prev) {
      byKey.set(k, { ...prev, lastSeenAt: new Date().toISOString() });
    } else {
      byKey.set(k, { ...inc, success: 0, failed: 0, lastSeenAt: inc.foundAt });
    }
  }
  return [...byKey.values()];
}

export function recordVote(coupon, vote) {
  if (vote !== "success" && vote !== "failed") throw new Error("invalid vote");
  const success = (coupon.success ?? 0) + (vote === "success" ? 1 : 0);
  const failed = (coupon.failed ?? 0) + (vote === "failed" ? 1 : 0);
  return { ...coupon, success, failed, lastVotedAt: new Date().toISOString() };
}

// Wilson lower-bound score to rank coupons fairly with low sample sizes.
export function successScore(coupon, z = 1.96) {
  const n = (coupon.success ?? 0) + (coupon.failed ?? 0);
  if (n === 0) return 0;
  const p = coupon.success / n;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return (center - margin) / denom;
}

export function rankCoupons(coupons) {
  return [...coupons].sort((a, b) => successScore(b) - successScore(a));
}

// Rewrite an outbound URL with our affiliate tag.
export function buildAffiliateUrl(rawUrl, affiliateConfig) {
  const url = new URL(rawUrl);
  const host = url.hostname.replace(/^www\./, "");
  const cfg = affiliateConfig[host];
  if (!cfg) return rawUrl;
  for (const [k, v] of Object.entries(cfg.params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

// Decide which subscribers to notify about a new coupon.
export function notificationTargets(coupon, subscriptions) {
  return subscriptions.filter((sub) => {
    if (sub.storeId && sub.storeId !== coupon.storeId) return false;
    if (sub.minDiscount && coupon.discount.value < sub.minDiscount) return false;
    return true;
  });
}
