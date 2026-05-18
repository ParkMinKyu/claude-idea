import { describe, it, expect } from "vitest";
import {
  addSwatch,
  MAX_FREE_SWATCHES,
  Palette,
  removeSwatch,
  reorder,
  toCssVariables,
  toTailwindTheme,
} from "../src/lib/palette";

const empty = (): Palette => ({ id: "x", name: "X", swatches: [] });

describe("addSwatch", () => {
  it("adds valid hex", () => {
    const p = addSwatch(empty(), "#336699");
    expect(p.swatches).toHaveLength(1);
    expect(p.swatches[0].hex).toBe("#336699");
  });
  it("dedupes by hex", () => {
    let p = addSwatch(empty(), "#ff0000");
    p = addSwatch(p, "#FF0000");
    expect(p.swatches).toHaveLength(1);
  });
  it("rejects invalid hex", () => {
    expect(() => addSwatch(empty(), "not-a-color")).toThrow();
  });
  it("enforces free limit", () => {
    let p = empty();
    for (let i = 0; i < MAX_FREE_SWATCHES + 2; i++) {
      const hex = "#" + i.toString(16).padStart(6, "0");
      p = addSwatch(p, hex);
    }
    expect(p.swatches).toHaveLength(MAX_FREE_SWATCHES);
  });
  it("pro can exceed", () => {
    let p = empty();
    for (let i = 0; i < MAX_FREE_SWATCHES + 5; i++) {
      const hex = "#" + i.toString(16).padStart(6, "0");
      p = addSwatch(p, hex, undefined, true);
    }
    expect(p.swatches.length).toBe(MAX_FREE_SWATCHES + 5);
  });
});

describe("removeSwatch / reorder", () => {
  it("remove", () => {
    let p = addSwatch(empty(), "#000000");
    p = removeSwatch(p, p.swatches[0].id);
    expect(p.swatches).toHaveLength(0);
  });
  it("reorder moves item", () => {
    let p = addSwatch(empty(), "#000000");
    p = addSwatch(p, "#ffffff");
    p = reorder(p, 0, 1);
    expect(p.swatches[0].hex).toBe("#ffffff");
  });
});

describe("export", () => {
  const sample = (): Palette => {
    let p = empty();
    p = addSwatch(p, "#336699", "brand");
    p = addSwatch(p, "#ffffff", "bg");
    return p;
  };
  it("toCssVariables", () => {
    const css = toCssVariables(sample());
    expect(css).toContain("--color-brand: #336699");
    expect(css).toContain("--color-bg: #ffffff");
  });
  it("toTailwindTheme is valid JSON-ish", () => {
    const t = toTailwindTheme(sample());
    expect(t).toContain('"brand": "#336699"');
    expect(t).toContain('"bg": "#ffffff"');
  });
});
