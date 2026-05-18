import { describe, it, expect } from "vitest";
import {
  haversineMeters,
  trucksNearby,
  deriveState,
  openTruck,
  closeTruck,
  followersToNotify,
  buildOgPayload,
} from "../src/locator.js";

describe("haversineMeters", () => {
  it("returns 0 for same point", () => {
    expect(haversineMeters({ lat: 37.5, lng: 127 }, { lat: 37.5, lng: 127 })).toBe(0);
  });

  it("matches known distance Seoul -> Busan within 1%", () => {
    const seoul = { lat: 37.5665, lng: 126.978 };
    const busan = { lat: 35.1796, lng: 129.0756 };
    const m = haversineMeters(seoul, busan);
    // ~325km
    expect(m).toBeGreaterThan(320_000);
    expect(m).toBeLessThan(330_000);
  });
});

describe("trucksNearby", () => {
  it("returns trucks sorted by distance, within radius", () => {
    const origin = { lat: 37.5665, lng: 126.978 };
    const trucks = [
      { id: "A", location: { lat: 37.5666, lng: 126.978 } }, // ~11m
      { id: "B", location: { lat: 37.6, lng: 126.978 } },     // ~3.7km
      { id: "C", location: null },                            // closed
    ];
    const out = trucksNearby(trucks, origin, 1000);
    expect(out.map((x) => x.truck.id)).toEqual(["A"]);
  });
});

describe("openTruck / deriveState", () => {
  const now = new Date("2026-05-18T04:00:00Z");
  it("opens with valid window", () => {
    const t = openTruck({ id: "T1" }, {
      location: { lat: 1, lng: 1 },
      openSince: new Date("2026-05-18T03:00:00Z"),
      openUntil: new Date("2026-05-18T08:00:00Z"),
    });
    expect(deriveState(t, now)).toBe("open");
  });

  it("returns ending_soon within last 5 minutes", () => {
    const t = openTruck({ id: "T1" }, {
      location: { lat: 1, lng: 1 },
      openSince: new Date("2026-05-18T03:00:00Z"),
      openUntil: new Date("2026-05-18T04:04:00Z"),
    });
    expect(deriveState(t, now)).toBe("ending_soon");
  });

  it("closed before openSince", () => {
    const t = openTruck({ id: "T1" }, {
      location: { lat: 1, lng: 1 },
      openSince: new Date("2026-05-18T05:00:00Z"),
      openUntil: new Date("2026-05-18T08:00:00Z"),
    });
    expect(deriveState(t, now)).toBe("closed");
  });

  it("closeTruck removes window", () => {
    const closed = closeTruck({ openSince: "x", openUntil: "y" });
    expect(deriveState(closed)).toBe("closed");
  });

  it("rejects bad location", () => {
    expect(() => openTruck({}, { location: null, openUntil: new Date(Date.now() + 1000) })).toThrow(/location/);
  });
});

describe("followersToNotify", () => {
  const truck = { id: "T1" };
  const now = new Date("2026-05-18T03:00:00Z"); // 12:00 KST (UTC+9)

  it("skips muted and wrong-truck followers", () => {
    const f = [
      { id: "1", truckId: "T1", muted: false, utcOffsetHours: 9 },
      { id: "2", truckId: "T1", muted: true, utcOffsetHours: 9 },
      { id: "3", truckId: "T9", muted: false, utcOffsetHours: 9 },
    ];
    const out = followersToNotify({ truck, followers: f, now });
    expect(out.map((x) => x.id)).toEqual(["1"]);
  });

  it("respects quiet hours", () => {
    const f = [{ id: "1", truckId: "T1", muted: false, utcOffsetHours: 9 }];
    // 23:00 KST = 14:00 UTC
    const quietNow = new Date("2026-05-18T14:00:00Z");
    expect(followersToNotify({ truck, followers: f, now: quietNow })).toHaveLength(0);
  });

  it("respects daily cap", () => {
    const f = [{ id: "1", truckId: "T1", muted: false, utcOffsetHours: 9, dailyCap: 1 }];
    const recent = [{ followerId: "1", sentAt: now.toISOString() }];
    expect(followersToNotify({ truck, followers: f, recentNotifications: recent, now })).toHaveLength(0);
  });
});

describe("buildOgPayload", () => {
  it("includes title with open status and up to 4 menu items", () => {
    const truck = { name: "타코맨", location: { address: "강남" }, openUntil: "2026-05-18T08:00:00Z" };
    const items = Array.from({ length: 6 }, (_, i) => ({ name: `메뉴${i}`, priceCents: 1000 * i }));
    const og = buildOgPayload(truck, { items });
    expect(og.title).toContain("타코맨");
    expect(og.items).toHaveLength(4);
  });
});
