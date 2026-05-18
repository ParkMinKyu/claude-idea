import { describe, it, expect } from "vitest";
import { hashToUnit, assignVariant, matchesSegment, zTest, bayesianProb, shouldStop } from "../src/ab.js";

describe("hashToUnit", () => {
  it("is deterministic", () => {
    expect(hashToUnit("user:1")).toBe(hashToUnit("user:1"));
  });
  it("returns value in [0,1)", () => {
    const u = hashToUnit("user:42");
    expect(u).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThan(1);
  });
});

describe("assignVariant", () => {
  const exp = {
    id: "price-test-1",
    variants: [
      { key: "A", weight: 1 },
      { key: "B", weight: 1 },
    ],
  };
  it("returns A or B", () => {
    expect(["A", "B"]).toContain(assignVariant(exp, "u1"));
  });
  it("distribution is roughly even", () => {
    let a = 0;
    for (let i = 0; i < 2000; i++) {
      if (assignVariant(exp, `user-${i}`) === "A") a++;
    }
    expect(Math.abs(a / 2000 - 0.5)).toBeLessThan(0.05);
  });
  it("respects weights", () => {
    const skewed = {
      id: "x",
      variants: [{ key: "A", weight: 9 }, { key: "B", weight: 1 }],
    };
    let a = 0;
    for (let i = 0; i < 2000; i++) {
      if (assignVariant(skewed, `u-${i}`) === "A") a++;
    }
    expect(a / 2000).toBeGreaterThan(0.8);
  });
});

describe("matchesSegment", () => {
  it("matches eq", () => {
    expect(matchesSegment({ country: "KR" }, [{ field: "country", op: "eq", value: "KR" }])).toBe(true);
  });
  it("rejects mismatch", () => {
    expect(matchesSegment({ country: "US" }, [{ field: "country", op: "eq", value: "KR" }])).toBe(false);
  });
  it("supports in op", () => {
    expect(
      matchesSegment({ plan: "pro" }, [{ field: "plan", op: "in", value: ["pro", "team"] }]),
    ).toBe(true);
  });
});

describe("zTest", () => {
  it("detects significant lift", () => {
    const r = zTest({ aConv: 100, aN: 1000, bConv: 200, bN: 1000 });
    expect(r.pValue).toBeLessThan(0.001);
    expect(r.lift).toBeGreaterThan(0.5);
  });
  it("non-significant for noise", () => {
    const r = zTest({ aConv: 100, aN: 1000, bConv: 105, bN: 1000 });
    expect(r.pValue).toBeGreaterThan(0.5);
  });
});

describe("bayesianProb", () => {
  it("approaches 1 when B clearly better", () => {
    const p = bayesianProb({ aConv: 100, aN: 1000, bConv: 300, bN: 1000 }, 2000);
    expect(p).toBeGreaterThan(0.99);
  });
  it("around 0.5 for equal", () => {
    const p = bayesianProb({ aConv: 100, aN: 1000, bConv: 100, bN: 1000 }, 3000);
    expect(Math.abs(p - 0.5)).toBeLessThan(0.1);
  });
});

describe("shouldStop", () => {
  it("stops when p < alpha", () => {
    expect(shouldStop({ pValue: 0.01, samples: 1000 })).toEqual({ stop: true, reason: "significant" });
  });
  it("stops on max samples", () => {
    expect(shouldStop({ pValue: 0.4, samples: 100_000 }).stop).toBe(true);
  });
  it("stops on bayes decisive", () => {
    expect(shouldStop({ pValue: 0.3, samples: 1000, bayesProb: 0.97 }).reason).toBe("bayes_decisive");
  });
  it("continues otherwise", () => {
    expect(shouldStop({ pValue: 0.2, samples: 1000 }).stop).toBe(false);
  });
});
