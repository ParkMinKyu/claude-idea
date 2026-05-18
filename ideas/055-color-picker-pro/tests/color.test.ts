import { describe, it, expect } from "vitest";
import {
  contrast,
  hexToRgb,
  hslToRgb,
  lighten,
  luminance,
  mix,
  rgbToHex,
  rgbToHsl,
  wcagLevel,
} from "../src/lib/color";

describe("hexToRgb / rgbToHex", () => {
  it("round trips 6 digit", () => {
    expect(rgbToHex(hexToRgb("#336699"))).toBe("#336699");
  });
  it("expands 3 digit", () => {
    expect(hexToRgb("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });
  it("rejects invalid", () => {
    expect(() => hexToRgb("#zzz")).toThrow();
  });
  it("handles alpha", () => {
    const rgb = hexToRgb("#ff000080");
    expect(rgb.r).toBe(255);
    expect(rgb.a).toBeCloseTo(0x80 / 255);
  });
});

describe("rgbToHsl / hslToRgb", () => {
  it("white", () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });
  it("pure red", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });
  it("round trips", () => {
    const hex = "#3366cc";
    const rgb = hexToRgb(hex);
    const back = hslToRgb(rgbToHsl(rgb));
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
  });
});

describe("luminance / contrast / wcagLevel", () => {
  it("white vs black is 21:1", () => {
    expect(contrast({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBe(21);
    expect(wcagLevel(21)).toBe("AAA");
  });
  it("low contrast fails", () => {
    expect(wcagLevel(2)).toBe("fail");
  });
  it("AA level around 4.5", () => {
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(3)).toBe("AA-large");
  });
  it("luminance white is 1", () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1);
  });
});

describe("mix / lighten", () => {
  it("mix midpoint", () => {
    expect(mix({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 })).toEqual({
      r: 50,
      g: 100,
      b: 25,
    });
  });
  it("lighten increases L", () => {
    const out = lighten({ r: 50, g: 50, b: 50 }, 20);
    expect(out.r).toBeGreaterThan(50);
  });
});
