import { describe, it, expect } from "vitest";
import {
  PRESETS,
  priceFromMargin,
  expandPreset,
  buildPrintfulSyncProducts,
  registerDesign,
} from "../src/pod.js";

const design = { name: "Cosmic Cat", url: "https://cdn.example.com/cat.png" };

describe("priceFromMargin", () => {
  it("computes retail price from cost + margin", () => {
    expect(priceFromMargin(10, 50)).toBe(20);
    expect(priceFromMargin(9.5, 40)).toBeCloseTo(15.83, 2);
  });
  it("rejects invalid margin", () => {
    expect(() => priceFromMargin(10, 100)).toThrow();
    expect(() => priceFromMargin(10, -1)).toThrow();
  });
});

describe("expandPreset", () => {
  it("expands apparel-pack into items × colors × sizes", () => {
    const variants = expandPreset(design, "apparel-pack", 40);
    const p = PRESETS["apparel-pack"];
    expect(variants).toHaveLength(p.items.length * p.colors.length * p.sizes.length);
    for (const v of variants) {
      expect(v.retail_price).toBeGreaterThan(0);
      expect(v.design_url).toBe(design.url);
    }
  });
  it("throws on unknown preset", () => {
    expect(() => expandPreset(design, "nonexistent")).toThrow();
  });
});

describe("buildPrintfulSyncProducts", () => {
  it("groups variants by catalog product", () => {
    const variants = expandPreset(design, "apparel-pack", 40);
    const sps = buildPrintfulSyncProducts(design, variants);
    expect(sps).toHaveLength(PRESETS["apparel-pack"].items.length);
    for (const sp of sps) {
      expect(sp.sync_product.name).toContain(design.name);
      expect(sp.sync_variants.length).toBeGreaterThan(0);
    }
  });
});

describe("registerDesign dry-run", () => {
  it("returns success entries without calling Printful", async () => {
    const r = await registerDesign(design, "drinkware-pack", { dryRun: true });
    expect(r.results.every((x) => x.ok)).toBe(true);
    expect(r.variants).toBe(2); // 2 items × 1 color × 1 size
  });
});
