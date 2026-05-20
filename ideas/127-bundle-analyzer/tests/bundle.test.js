import { describe, it, expect } from "vitest";
import { parseStats, estimateGzip, totals } from "../src/parser.js";
import { diffAssets } from "../src/diff.js";
import { assertBundle, matchPattern } from "../src/assert.js";
import { toMarkdown } from "../src/report.js";

const WEBPACK_STATS = {
  assets: [
    { name: "main.js", size: 200_000 },
    { name: "vendor.js", size: 500_000, gzipSize: 160_000 },
    { name: "main.js.map", size: 800_000 },
  ],
};

const BASELINE_STATS = {
  assets: [
    { name: "main.js", size: 180_000 },
    { name: "vendor.js", size: 500_000, gzipSize: 160_000 },
  ],
};

describe("parseStats", () => {
  it("normalizes webpack assets and excludes sourcemaps", () => {
    const assets = parseStats(WEBPACK_STATS);
    expect(Object.keys(assets).sort()).toEqual(["main.js", "vendor.js"]);
    expect(assets["vendor.js"].gzip).toBe(160_000);
  });
  it("estimates gzip when missing", () => {
    const assets = parseStats(WEBPACK_STATS);
    expect(assets["main.js"].gzip).toBe(estimateGzip(200_000));
  });
  it("parses rollup/vite output shape", () => {
    const assets = parseStats({ output: { "app.js": { size: 1000, gzip: 400 } } });
    expect(assets["app.js"]).toEqual({ size: 1000, gzip: 400 });
  });
  it("totals across assets", () => {
    const t = totals(parseStats(WEBPACK_STATS));
    expect(t.size).toBe(700_000);
  });
});

describe("diffAssets", () => {
  it("computes per-asset deltas and statuses", () => {
    const diff = diffAssets(parseStats(BASELINE_STATS), parseStats(WEBPACK_STATS));
    const main = diff.assets.find((a) => a.name === "main.js");
    expect(main.delta).toBe(20_000);
    expect(main.status).toBe("changed");
    expect(diff.totalDelta).toBe(20_000);
  });
  it("marks added and removed assets", () => {
    const diff = diffAssets({ "old.js": { size: 100, gzip: 32 } }, { "new.js": { size: 200, gzip: 64 } });
    const statuses = Object.fromEntries(diff.assets.map((a) => [a.name, a.status]));
    expect(statuses["old.js"]).toBe("removed");
    expect(statuses["new.js"]).toBe("added");
  });
});

describe("matchPattern", () => {
  it("supports leading/trailing wildcards", () => {
    expect(matchPattern("main.js", "*.js")).toBe(true);
    expect(matchPattern("vendor.css", "*.js")).toBe(false);
    expect(matchPattern("chunk-abc.js", "chunk-*")).toBe(true);
  });
});

describe("assertBundle", () => {
  const current = parseStats(WEBPACK_STATS);
  const diff = diffAssets(parseStats(BASELINE_STATS), current);

  it("flags budget violations", () => {
    const r = assertBundle(current, diff, { budgets: [{ pattern: "vendor.js", maxBytes: 400_000 }] });
    expect(r.passed).toBe(false);
    expect(r.violations[0].type).toBe("budget");
  });

  it("flags regression by percent", () => {
    const r = assertBundle(current, diff, { regression: { maxIncreasePct: 0.05 } });
    expect(r.violations.some((v) => v.type === "regression" && v.name === "main.js")).toBe(true);
  });

  it("passes within limits and renders markdown", () => {
    const r = assertBundle(current, diff, { budgets: [{ pattern: "*.js", maxBytes: 1_000_000 }] });
    expect(r.passed).toBe(true);
    expect(toMarkdown(r)).toContain("번들 사이즈 검사");
  });
});
