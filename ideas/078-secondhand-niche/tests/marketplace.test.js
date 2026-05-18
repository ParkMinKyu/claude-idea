import { describe, it, expect } from "vitest";
import {
  LISTING_STATES,
  calculateFees,
  validateListing,
  computeVerificationBadges,
  transition,
  shouldAutoRelease,
  searchListings,
  priceTrend,
} from "../src/marketplace.js";

describe("calculateFees", () => {
  it("deducts platform + stripe fees", () => {
    const f = calculateFees(100_000); // $1,000
    expect(f.platformFee).toBe(6000);
    expect(f.stripeFee).toBe(Math.round(100_000 * 0.029 + 30));
    expect(f.sellerPayout).toBe(100_000 - f.platformFee - f.stripeFee);
  });
});

describe("validateListing", () => {
  it("rejects missing fields", () => {
    const r = validateListing({ title: "x", priceCents: 100, photos: [] });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("title too short");
    expect(r.errors).toContain("model required");
  });
  it("accepts a valid listing", () => {
    const r = validateListing({
      title: "Sony A7M4 like new",
      model: "ILCE-7M4",
      priceCents: 220_000,
      photos: ["a.jpg"],
      shutterCount: 1200,
    });
    expect(r.ok).toBe(true);
  });
});

describe("badges", () => {
  it("awards badges based on uploaded proof photos", () => {
    const b = computeVerificationBadges({
      shutterCountPhotoUrl: "x",
      serialPhotoUrl: "y",
    });
    expect(b).toEqual(["shutter_verified", "serial_verified"]);
  });
});

describe("escrow state machine", () => {
  it("transitions active -> reserved -> in_escrow -> completed", () => {
    let s = LISTING_STATES.ACTIVE;
    s = transition(s, "buy");
    expect(s).toBe(LISTING_STATES.RESERVED);
    s = transition(s, "pay");
    expect(s).toBe(LISTING_STATES.IN_ESCROW);
    s = transition(s, "accept");
    expect(s).toBe(LISTING_STATES.COMPLETED);
  });
  it("rejects invalid transition", () => {
    expect(() => transition(LISTING_STATES.ACTIVE, "accept")).toThrow();
  });
  it("auto-releases escrow after 7 days", () => {
    const enteredAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
    expect(shouldAutoRelease(enteredAt)).toBe(true);
    expect(shouldAutoRelease(Date.now() - 1000)).toBe(false);
  });
});

describe("searchListings", () => {
  const listings = [
    { title: "Sony A7M4", brand: "Sony", model: "A7M4", priceCents: 200_000, state: "active", createdAt: 1 },
    { title: "Canon R5", brand: "Canon", model: "R5", priceCents: 350_000, state: "active", createdAt: 2 },
    { title: "Sold Sony", brand: "Sony", model: "A7M4", priceCents: 180_000, state: "completed", createdAt: 0 },
  ];
  it("filters by brand and price", () => {
    const r = searchListings(listings, { brand: "Sony", maxPrice: 250_000 });
    expect(r).toHaveLength(1);
    expect(r[0].brand).toBe("Sony");
  });
  it("sorts by price ascending", () => {
    const r = searchListings(listings, { sort: "price_asc" });
    expect(r[0].priceCents).toBe(200_000);
  });
});

describe("priceTrend", () => {
  it("returns median, min, max for sold listings of a model", () => {
    const sold = [
      { model: "A7M4", priceCents: 200_000, soldAt: Date.now() - 1000 },
      { model: "A7M4", priceCents: 180_000, soldAt: Date.now() - 2000 },
      { model: "A7M4", priceCents: 220_000, soldAt: Date.now() - 3000 },
      { model: "R5", priceCents: 350_000, soldAt: Date.now() - 1000 },
    ];
    const trend = priceTrend(sold, "A7M4");
    expect(trend.count).toBe(3);
    expect(trend.median).toBe(200_000);
    expect(trend.min).toBe(180_000);
    expect(trend.max).toBe(220_000);
  });
});
