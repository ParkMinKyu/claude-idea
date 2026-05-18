// Subscription royalty pool: distribute the month's pool to authors based
// on each author's share of total listening time.
//
// Inputs:
//   - poolKrw: total payout pool (e.g. revenue * 0.6)
//   - listens: [{ bookId, authorId, seconds }]
//   - platformCutRatio: default 0.0 (already excluded), here for safety
//
// Output: Map<authorId, amountKrw> with whole-won rounding,
// rounding error allocated to the largest payee so sum == poolKrw.

export function distributeSubscriptionPool({ poolKrw, listens, platformCutRatio = 0 }) {
  if (!(poolKrw >= 0) || !Array.isArray(listens)) {
    throw new TypeError('poolKrw must be >= 0 and listens must be an array');
  }
  const payable = Math.max(0, Math.floor(poolKrw * (1 - platformCutRatio)));
  if (payable === 0) return new Map();

  const totals = new Map(); // authorId -> seconds
  let totalSeconds = 0;
  for (const l of listens) {
    const s = Math.max(0, Number(l.seconds) || 0);
    totals.set(l.authorId, (totals.get(l.authorId) || 0) + s);
    totalSeconds += s;
  }
  if (totalSeconds === 0) return new Map();

  const out = new Map();
  let allocated = 0;
  for (const [authorId, sec] of totals.entries()) {
    const amt = Math.floor((payable * sec) / totalSeconds);
    out.set(authorId, amt);
    allocated += amt;
  }
  const remainder = payable - allocated;
  if (remainder > 0 && out.size > 0) {
    // give residual to the biggest payee for determinism
    let topId = null;
    let topAmt = -1;
    for (const [id, amt] of out) {
      if (amt > topAmt) {
        topAmt = amt;
        topId = id;
      }
    }
    out.set(topId, topAmt + remainder);
  }
  return out;
}

// Single-purchase royalty: author gets sale - platform fee.
export function singlePurchaseRoyalty({ priceKrw, platformCutRatio = 0.25 }) {
  if (!(priceKrw >= 0)) throw new TypeError('priceKrw must be >= 0');
  if (platformCutRatio < 0 || platformCutRatio >= 1) {
    throw new RangeError('platformCutRatio must be in [0, 1)');
  }
  return Math.floor(priceKrw * (1 - platformCutRatio));
}
