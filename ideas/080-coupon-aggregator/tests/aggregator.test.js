import { describe, it, expect } from "vitest";
import {
  parseCouponsFromText,
  mergeCoupons,
  recordVote,
  successScore,
  rankCoupons,
  buildAffiliateUrl,
  notificationTargets,
} from "../src/aggregator.js";

describe("parseCouponsFromText", () => {
  it("extracts code + percent discount from copy", () => {
    const text = "Use SUMMER15 - 15% off everything! Or BLACK20 — 20% 할인";
    const coupons = parseCouponsFromText(text, "store-a");
    const codes = coupons.map((c) => c.code);
    expect(codes).toContain("SUMMER15");
    expect(codes).toContain("BLACK20");
  });
  it("dedupes identical codes", () => {
    const text = "SAVE10 10% off and again SAVE10 10% off";
    const coupons = parseCouponsFromText(text, "store-a");
    expect(coupons).toHaveLength(1);
  });
});

describe("mergeCoupons", () => {
  it("preserves votes when re-scraping", () => {
    const existing = [
      { storeId: "a", code: "X", success: 3, failed: 1, lastSeenAt: "2020-01-01" },
    ];
    const incoming = [
      { storeId: "a", code: "X", foundAt: new Date().toISOString(), discount: { type: "percent", value: 10 } },
      { storeId: "a", code: "Y", foundAt: new Date().toISOString(), discount: { type: "percent", value: 5 } },
    ];
    const merged = mergeCoupons(existing, incoming);
    expect(merged).toHaveLength(2);
    const x = merged.find((c) => c.code === "X");
    expect(x.success).toBe(3);
    expect(x.lastSeenAt).not.toBe("2020-01-01");
  });
});

describe("recordVote / successScore / rankCoupons", () => {
  it("ranks higher-success coupons above noisy ones", () => {
    let highSuccess = { storeId: "a", code: "HIGH", success: 18, failed: 2 };
    let lowSuccess = { storeId: "a", code: "LOW", success: 1, failed: 0 };
    expect(successScore(highSuccess)).toBeGreaterThan(successScore(lowSuccess));
    const ranked = rankCoupons([lowSuccess, highSuccess]);
    expect(ranked[0].code).toBe("HIGH");
  });
  it("records votes correctly", () => {
    const c = { storeId: "a", code: "X" };
    const v1 = recordVote(c, "success");
    const v2 = recordVote(v1, "failed");
    expect(v2.success).toBe(1);
    expect(v2.failed).toBe(1);
    expect(() => recordVote(c, "ehh")).toThrow();
  });
});

describe("buildAffiliateUrl", () => {
  it("appends affiliate params for known hosts", () => {
    const cfg = {
      "amazon.com": { params: { tag: "myaff-20" } },
    };
    const out = buildAffiliateUrl("https://www.amazon.com/dp/B0XYZ", cfg);
    expect(out).toContain("tag=myaff-20");
  });
  it("leaves unknown hosts untouched", () => {
    const out = buildAffiliateUrl("https://unknown.com/path", {});
    expect(out).toBe("https://unknown.com/path");
  });
});

describe("notificationTargets", () => {
  it("filters by store and min discount", () => {
    const coupon = { storeId: "a", discount: { type: "percent", value: 15 } };
    const subs = [
      { id: 1, storeId: "a", minDiscount: 10 },
      { id: 2, storeId: "a", minDiscount: 20 },
      { id: 3, storeId: "b" },
    ];
    const targets = notificationTargets(coupon, subs);
    expect(targets.map((t) => t.id)).toEqual([1]);
  });
});
