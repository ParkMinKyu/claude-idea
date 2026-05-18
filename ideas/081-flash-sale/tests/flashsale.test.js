import { describe, it, expect } from "vitest";
import {
  detectNewSales,
  matchSubscribers,
  applyThrottle,
  buildPushPayload,
  endingSoonSales,
} from "../src/flashsale.js";

describe("detectNewSales", () => {
  it("returns only sales not in known set", () => {
    const known = new Set(["a", "b"]);
    const sales = [{ id: "a" }, { id: "c" }, { id: "d" }];
    const newOnes = detectNewSales(sales, known);
    expect(newOnes.map((s) => s.id)).toEqual(["c", "d"]);
  });
  it("throws when sale missing id", () => {
    expect(() => detectNewSales([{ title: "x" }], new Set())).toThrow();
  });
});

describe("matchSubscribers", () => {
  const sale = { id: "s1", brand: "Nike", category: "shoes", discountPct: 30 };
  it("filters by brand, category, min discount", () => {
    const subs = [
      { userId: 1, brands: ["Nike"], minDiscountPct: 20 },
      { userId: 2, brands: ["Adidas"] },
      { userId: 3, categories: ["shoes"], minDiscountPct: 50 },
      { userId: 4 }, // any
    ];
    const matched = matchSubscribers(sale, subs);
    expect(matched.map((m) => m.userId).sort()).toEqual([1, 4]);
  });
  it("respects quiet hours that wrap midnight", () => {
    // local 02:00, quiet 23-7 => suppressed
    const tz = 0;
    const now = Date.UTC(2025, 0, 1, 2, 0, 0); // 02:00 UTC
    const subs = [{ userId: 1, timezoneOffsetMin: tz, quietHours: { startHour: 23, endHour: 7 } }];
    expect(matchSubscribers(sale, subs, now)).toHaveLength(0);
  });
});

describe("applyThrottle", () => {
  it("caps notifications per user per hour", () => {
    const subs = Array.from({ length: 15 }, (_, i) => ({ userId: 1, id: i }));
    const recent = new Map();
    const allowed = applyThrottle(subs, recent, 10);
    expect(allowed).toHaveLength(10);
  });
});

describe("buildPushPayload", () => {
  it("includes minutes left when endsAt provided", () => {
    const sale = {
      id: "s",
      brand: "Nike",
      discountPct: 40,
      title: "AJ1",
      url: "https://nike.test",
      endsAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    };
    const p = buildPushPayload(sale);
    expect(p.title).toContain("Nike");
    expect(p.body).toMatch(/분 남음/);
    expect(p.requireInteraction).toBe(true);
  });
});

describe("endingSoonSales", () => {
  it("flags sales ending within window", () => {
    const sales = [
      { id: "a", endsAt: new Date(Date.now() + 10 * 60_000).toISOString() },
      { id: "b", endsAt: new Date(Date.now() + 90 * 60_000).toISOString() },
      { id: "c", endsAt: new Date(Date.now() - 1000).toISOString() },
    ];
    const ending = endingSoonSales(sales, Date.now(), 30);
    expect(ending.map((s) => s.id)).toEqual(["a"]);
  });
});
