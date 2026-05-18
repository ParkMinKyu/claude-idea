import { describe, it, expect } from "vitest";
import {
  RENTAL_STATES,
  dayCount,
  priceQuote,
  hasConflict,
  requestRental,
  transitionRental,
  distanceKm,
  searchListings,
  createStore,
} from "../src/rental.js";

const droneListing = {
  id: "l-drone",
  hostId: "host-1",
  category: "drone",
  dailyPriceCents: 30_000,
  depositCents: 100_000,
  location: { lat: 37.5665, lng: 126.9780 }, // Seoul
};

describe("dayCount + priceQuote", () => {
  it("computes 3-day rental quote", () => {
    const q = priceQuote(droneListing, "2025-06-01", "2025-06-04");
    expect(q.days).toBe(3);
    expect(q.rental).toBe(90_000);
    expect(q.guestFee).toBe(Math.round(90_000 * 0.04));
    expect(q.hostFee).toBe(Math.round(90_000 * 0.08));
    expect(q.guestCharge).toBe(q.rental + q.guestFee + q.deposit);
    expect(q.hostPayout).toBe(q.rental - q.hostFee);
  });
  it("rejects invalid date range", () => {
    expect(() => dayCount("2025-01-02", "2025-01-01")).toThrow();
  });
});

describe("hasConflict + requestRental", () => {
  it("detects overlapping bookings", () => {
    const store = createStore();
    store.listings.set(droneListing.id, droneListing);
    requestRental(store, { listingId: "l-drone", guestId: "g1", startDate: "2025-06-01", endDate: "2025-06-04" });
    expect(() =>
      requestRental(store, { listingId: "l-drone", guestId: "g2", startDate: "2025-06-03", endDate: "2025-06-06" })
    ).toThrow(/conflict/);
  });
  it("allows back-to-back bookings", () => {
    const store = createStore();
    store.listings.set(droneListing.id, droneListing);
    requestRental(store, { listingId: "l-drone", guestId: "g1", startDate: "2025-06-01", endDate: "2025-06-04" });
    expect(() =>
      requestRental(store, { listingId: "l-drone", guestId: "g2", startDate: "2025-06-04", endDate: "2025-06-06" })
    ).not.toThrow();
  });
});

describe("transitionRental", () => {
  it("walks happy path", () => {
    let s = RENTAL_STATES.REQUESTED;
    s = transitionRental(s, "confirm");
    s = transitionRental(s, "start");
    s = transitionRental(s, "return");
    s = transitionRental(s, "release_deposit");
    expect(s).toBe(RENTAL_STATES.COMPLETED);
  });
  it("supports dispute branch", () => {
    const s = transitionRental(RENTAL_STATES.ACTIVE, "dispute");
    expect(s).toBe(RENTAL_STATES.DISPUTED);
    expect(transitionRental(s, "resolve_refund")).toBe(RENTAL_STATES.CANCELED);
  });
  it("rejects invalid transition", () => {
    expect(() => transitionRental(RENTAL_STATES.REQUESTED, "return")).toThrow();
  });
});

describe("searchListings (geo)", () => {
  const farAway = {
    ...droneListing,
    id: "l-busan",
    location: { lat: 35.1796, lng: 129.0756 }, // Busan ~325 km from Seoul
  };
  it("filters by radius from a point", () => {
    const out = searchListings(
      [droneListing, farAway],
      { near: { lat: 37.5, lng: 126.9 }, radiusKm: 50 }
    );
    expect(out.map((l) => l.id)).toEqual(["l-drone"]);
  });
  it("filters by category and max price", () => {
    const cheap = { ...droneListing, id: "l-cheap", dailyPriceCents: 5000, category: "camera" };
    const out = searchListings([droneListing, cheap], { category: "camera", maxDailyPriceCents: 10_000 });
    expect(out.map((l) => l.id)).toEqual(["l-cheap"]);
  });
});

describe("distanceKm", () => {
  it("computes a sane Seoul→Busan distance", () => {
    const d = distanceKm({ lat: 37.5665, lng: 126.978 }, { lat: 35.1796, lng: 129.0756 });
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(360);
  });
});
