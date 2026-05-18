// Camera secondhand marketplace MVP — listing, escrow state machine,
// fee calculation, and basic search/sort.

export const LISTING_STATES = {
  DRAFT: "draft",
  ACTIVE: "active",
  RESERVED: "reserved",
  IN_ESCROW: "in_escrow",
  COMPLETED: "completed",
  CANCELED: "canceled",
  DISPUTED: "disputed",
};

export const PLATFORM_FEE_PCT = 6;

export function calculateFees(amountCents) {
  if (amountCents <= 0) throw new Error("amount must be positive");
  const platformFee = Math.round((amountCents * PLATFORM_FEE_PCT) / 100);
  // Stripe domestic card approx: 2.9% + 30c
  const stripeFee = Math.round(amountCents * 0.029 + 30);
  const sellerPayout = amountCents - platformFee - stripeFee;
  return { amountCents, platformFee, stripeFee, sellerPayout };
}

export function validateListing(input) {
  const errors = [];
  if (!input.title || input.title.length < 3) errors.push("title too short");
  if (!input.model) errors.push("model required");
  if (!Number.isFinite(input.priceCents) || input.priceCents < 1000) errors.push("price must be >= 1000 cents");
  if (!Array.isArray(input.photos) || input.photos.length < 1) errors.push("at least 1 photo required");
  if (input.shutterCount != null && (!Number.isInteger(input.shutterCount) || input.shutterCount < 0)) {
    errors.push("shutterCount must be a non-negative integer");
  }
  return { ok: errors.length === 0, errors };
}

export function computeVerificationBadges(listing) {
  const badges = [];
  if (listing.shutterCountPhotoUrl) badges.push("shutter_verified");
  if (listing.serialPhotoUrl) badges.push("serial_verified");
  if (listing.boxPhotoUrl) badges.push("box_included");
  return badges;
}

// Escrow finite-state machine.
export function transition(currentState, action) {
  const map = {
    [LISTING_STATES.ACTIVE]: {
      buy: LISTING_STATES.RESERVED,
      cancel: LISTING_STATES.CANCELED,
    },
    [LISTING_STATES.RESERVED]: {
      pay: LISTING_STATES.IN_ESCROW,
      cancel: LISTING_STATES.ACTIVE,
    },
    [LISTING_STATES.IN_ESCROW]: {
      accept: LISTING_STATES.COMPLETED,
      dispute: LISTING_STATES.DISPUTED,
      auto_release: LISTING_STATES.COMPLETED,
    },
    [LISTING_STATES.DISPUTED]: {
      refund: LISTING_STATES.CANCELED,
      release: LISTING_STATES.COMPLETED,
    },
  };
  const next = map[currentState]?.[action];
  if (!next) throw new Error(`Invalid transition ${currentState} --${action}-->`);
  return next;
}

export function shouldAutoRelease(escrowEnteredAt, nowMs = Date.now(), windowDays = 7) {
  const elapsedMs = nowMs - escrowEnteredAt;
  return elapsedMs >= windowDays * 24 * 60 * 60 * 1000;
}

export function searchListings(listings, query) {
  const q = (query.text ?? "").toLowerCase();
  let filtered = listings.filter((l) => {
    if (l.state !== LISTING_STATES.ACTIVE) return false;
    if (q && !(`${l.title} ${l.model} ${l.brand ?? ""}`.toLowerCase().includes(q))) return false;
    if (query.brand && l.brand !== query.brand) return false;
    if (query.minPrice != null && l.priceCents < query.minPrice) return false;
    if (query.maxPrice != null && l.priceCents > query.maxPrice) return false;
    return true;
  });
  if (query.sort === "price_asc") filtered.sort((a, b) => a.priceCents - b.priceCents);
  if (query.sort === "price_desc") filtered.sort((a, b) => b.priceCents - a.priceCents);
  if (query.sort === "newest") filtered.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return filtered;
}

// Median sale price for a model over last `days`.
export function priceTrend(soldListings, model, days = 30, nowMs = Date.now()) {
  const cutoff = nowMs - days * 24 * 60 * 60 * 1000;
  const relevant = soldListings.filter((l) => l.model === model && l.soldAt >= cutoff);
  if (!relevant.length) return null;
  const prices = relevant.map((l) => l.priceCents).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  return { model, count: relevant.length, median, min: prices[0], max: prices[prices.length - 1] };
}
