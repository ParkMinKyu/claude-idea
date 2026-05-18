// Daily rental marketplace MVP — pricing, calendar conflict detection,
// payout splits via Stripe Connect, rental state machine, geo search.

const DAY_MS = 24 * 60 * 60 * 1000;
const PLATFORM_HOST_FEE_PCT = 8;
const PLATFORM_GUEST_FEE_PCT = 4;

export const RENTAL_STATES = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  ACTIVE: "active",
  RETURNED: "returned",
  COMPLETED: "completed",
  DISPUTED: "disputed",
  CANCELED: "canceled",
};

export function dayCount(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) {
    throw new Error("invalid date range");
  }
  return Math.ceil((e - s) / DAY_MS);
}

export function priceQuote(listing, startDate, endDate) {
  const days = dayCount(startDate, endDate);
  const rental = listing.dailyPriceCents * days;
  const guestFee = Math.round((rental * PLATFORM_GUEST_FEE_PCT) / 100);
  const hostFee = Math.round((rental * PLATFORM_HOST_FEE_PCT) / 100);
  const deposit = listing.depositCents ?? 0;
  const guestCharge = rental + guestFee + deposit;
  const hostPayout = rental - hostFee;
  return { days, rental, guestFee, hostFee, deposit, guestCharge, hostPayout };
}

export function hasConflict(listing, existingRentals, startDate, endDate) {
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  for (const r of existingRentals) {
    if (r.listingId !== listing.id) continue;
    if (r.state === RENTAL_STATES.CANCELED) continue;
    const rs = new Date(r.startDate).getTime();
    const re = new Date(r.endDate).getTime();
    if (s < re && rs < e) return true; // overlap
  }
  return false;
}

export function requestRental(store, { listingId, guestId, startDate, endDate }) {
  const listing = store.listings.get(listingId);
  if (!listing) throw new Error("listing not found");
  if (hasConflict(listing, [...store.rentals.values()], startDate, endDate)) {
    throw new Error("date conflict");
  }
  const quote = priceQuote(listing, startDate, endDate);
  const id = `r-${store.rentals.size + 1}`;
  const rental = {
    id,
    listingId,
    hostId: listing.hostId,
    guestId,
    startDate,
    endDate,
    quote,
    state: RENTAL_STATES.REQUESTED,
    createdAt: new Date().toISOString(),
  };
  store.rentals.set(id, rental);
  return rental;
}

export function transitionRental(currentState, action) {
  const map = {
    [RENTAL_STATES.REQUESTED]: {
      confirm: RENTAL_STATES.CONFIRMED,
      cancel: RENTAL_STATES.CANCELED,
    },
    [RENTAL_STATES.CONFIRMED]: {
      start: RENTAL_STATES.ACTIVE,
      cancel: RENTAL_STATES.CANCELED,
    },
    [RENTAL_STATES.ACTIVE]: {
      return: RENTAL_STATES.RETURNED,
      dispute: RENTAL_STATES.DISPUTED,
    },
    [RENTAL_STATES.RETURNED]: {
      release_deposit: RENTAL_STATES.COMPLETED,
      dispute: RENTAL_STATES.DISPUTED,
    },
    [RENTAL_STATES.DISPUTED]: {
      resolve_complete: RENTAL_STATES.COMPLETED,
      resolve_refund: RENTAL_STATES.CANCELED,
    },
  };
  const next = map[currentState]?.[action];
  if (!next) throw new Error(`bad transition ${currentState} --${action}-->`);
  return next;
}

// Haversine distance in km.
export function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

export function searchListings(listings, opts) {
  let r = listings.slice();
  if (opts.category) r = r.filter((l) => l.category === opts.category);
  if (opts.maxDailyPriceCents != null) r = r.filter((l) => l.dailyPriceCents <= opts.maxDailyPriceCents);
  if (opts.near && opts.radiusKm != null) {
    r = r
      .map((l) => ({ ...l, _dist: distanceKm(opts.near, l.location) }))
      .filter((l) => l._dist <= opts.radiusKm)
      .sort((a, b) => a._dist - b._dist);
  }
  return r;
}

export function createStore() {
  return { listings: new Map(), rentals: new Map() };
}
