import { describe, it, expect } from "vitest";
import { extractMetrics, violatesBudget } from "../src/metrics.js";
import { assertBudgets, assertRegression, evaluate } from "../src/assert.js";
import { toMarkdown } from "../src/report.js";

const LHR = {
  categories: { performance: { score: 0.82 } },
  audits: {
    "largest-contentful-paint": { numericValue: 2400 },
    "cumulative-layout-shift": { numericValue: 0.08 },
    "total-blocking-time": { numericValue: 180 },
    "first-contentful-paint": { numericValue: 1200 },
  },
};

describe("extractMetrics", () => {
  it("pulls score and audit numeric values", () => {
    const m = extractMetrics(LHR);
    expect(m.performance).toBe(0.82);
    expect(m.lcp).toBe(2400);
    expect(m.cls).toBe(0.08);
  });
  it("returns nulls for missing fields", () => {
    expect(extractMetrics({}).lcp).toBeNull();
  });
});

describe("violatesBudget", () => {
  it("max bound", () => {
    expect(violatesBudget("lcp", 3000, { max: 2500 })).toBe(true);
    expect(violatesBudget("lcp", 2000, { max: 2500 })).toBe(false);
  });
  it("min bound (higher-is-better)", () => {
    expect(violatesBudget("performance", 0.7, { min: 0.9 })).toBe(true);
  });
});

describe("assertBudgets", () => {
  it("reports violations for over-budget metrics", () => {
    const m = extractMetrics(LHR);
    const v = assertBudgets(m, [
      { metric: "lcp", max: 2000 },
      { metric: "performance", min: 0.9 },
      { metric: "cls", max: 0.1 },
    ]);
    const metrics = v.map((x) => x.metric).sort();
    expect(metrics).toEqual(["lcp", "performance"]);
  });
});

describe("assertRegression", () => {
  const current = extractMetrics(LHR);
  it("flags lower-is-better metric getting worse beyond tolerance", () => {
    const baseline = { ...current, lcp: 2000 }; // current 2400 = +20%
    const v = assertRegression(current, baseline, 0.05);
    expect(v.some((x) => x.metric === "lcp")).toBe(true);
  });
  it("does not flag improvement", () => {
    const baseline = { ...current, lcp: 3000 }; // current 2400 = improvement
    const v = assertRegression(current, baseline, 0.05);
    expect(v.some((x) => x.metric === "lcp")).toBe(false);
  });
  it("flags higher-is-better score dropping", () => {
    const baseline = { ...current, performance: 0.95 }; // current 0.82 = drop
    const v = assertRegression(current, baseline, 0.05);
    expect(v.some((x) => x.metric === "performance")).toBe(true);
  });
});

describe("evaluate + report", () => {
  it("passes when no budgets/baseline violated", () => {
    const m = extractMetrics(LHR);
    const r = evaluate(m, { budgets: [{ metric: "lcp", max: 5000 }] });
    expect(r.passed).toBe(true);
  });
  it("fails and renders markdown with violations", () => {
    const m = extractMetrics(LHR);
    const r = evaluate(m, { budgets: [{ metric: "lcp", max: 1000 }] });
    expect(r.passed).toBe(false);
    expect(toMarkdown(r)).toContain("실패");
  });
});
