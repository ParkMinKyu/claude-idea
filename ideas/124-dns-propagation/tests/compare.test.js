import { describe, it, expect } from "vitest";
import { normalizeRecords, signature, groupBySignature, propagation } from "../src/compare.js";
import { checkPropagation } from "../src/check.js";

describe("normalizeRecords", () => {
  it("flattens, lowercases, sorts and dedupes", () => {
    expect(normalizeRecords(["B", "a", "a", "C"])).toEqual(["a", "b", "c"]);
  });
  it("joins nested TXT chunks", () => {
    expect(normalizeRecords([["v=spf1 ", "include:_spf"]])).toEqual(["v=spf1 include:_spf"]);
  });
  it("handles null", () => {
    expect(normalizeRecords(null)).toEqual([]);
  });
});

describe("signature / groupBySignature", () => {
  it("treats reordered records as identical", () => {
    expect(signature(["1.1.1.1", "2.2.2.2"])).toBe(signature(["2.2.2.2", "1.1.1.1"]));
  });
  it("groups resolvers by response, largest first", () => {
    const results = [
      { resolver: "A", records: ["1.1.1.1"] },
      { resolver: "B", records: ["1.1.1.1"] },
      { resolver: "C", records: ["9.9.9.9"] },
      { resolver: "D", records: null, error: "ENOTFOUND" },
    ];
    const groups = groupBySignature(results);
    expect(groups[0].resolvers).toEqual(["A", "B"]);
    expect(groups.length).toBe(2);
  });
});

describe("propagation", () => {
  const fullyPropagated = [
    { resolver: "A", records: ["1.1.1.1"] },
    { resolver: "B", records: ["1.1.1.1"] },
  ];
  const partial = [
    { resolver: "A", records: ["1.1.1.1"] },
    { resolver: "B", records: ["1.1.1.1"] },
    { resolver: "C", records: ["2.2.2.2"] },
  ];

  it("reports 100% and consistent when all agree", () => {
    const p = propagation(fullyPropagated);
    expect(p.rate).toBe(1);
    expect(p.consistent).toBe(true);
    expect(p.mismatched).toEqual([]);
  });

  it("computes partial propagation against expected value", () => {
    const p = propagation(partial, ["1.1.1.1"]);
    expect(p.rate).toBeCloseTo(2 / 3, 5);
    expect(p.matched.sort()).toEqual(["A", "B"]);
    expect(p.mismatched).toEqual(["C"]);
    expect(p.consistent).toBe(false);
  });

  it("excludes errored resolvers from the denominator", () => {
    const p = propagation([
      { resolver: "A", records: ["1.1.1.1"] },
      { resolver: "B", records: null, error: "SERVFAIL" },
    ]);
    expect(p.rate).toBe(1);
    expect(p.errored).toEqual(["B"]);
  });
});

describe("checkPropagation (injected query)", () => {
  it("aggregates injected resolver responses", async () => {
    const fake = async (_d, _t, ip, name) => ({
      resolver: name,
      records: name === "Quad9" ? ["2.2.2.2"] : ["1.1.1.1"],
    });
    const report = await checkPropagation("example.com", "A", {
      resolvers: [
        { name: "Google", ip: "8.8.8.8" },
        { name: "Cloudflare", ip: "1.1.1.1" },
        { name: "Quad9", ip: "9.9.9.9" },
      ],
      queryImpl: fake,
      expected: ["1.1.1.1"],
    });
    expect(report.rate).toBeCloseTo(2 / 3, 5);
    expect(report.mismatched).toEqual(["Quad9"]);
  });
});
