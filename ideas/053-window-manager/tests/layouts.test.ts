import { describe, it, expect } from "vitest";
import { computeBounds, nextDisplay, Rect } from "../src/main/layouts";

const fullHD: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

describe("computeBounds", () => {
  it("left-half", () => {
    expect(computeBounds("left-half", fullHD)).toEqual({
      x: 0,
      y: 0,
      width: 960,
      height: 1080,
    });
  });
  it("right-half", () => {
    expect(computeBounds("right-half", fullHD)).toEqual({
      x: 960,
      y: 0,
      width: 960,
      height: 1080,
    });
  });
  it("top-left quarter", () => {
    expect(computeBounds("top-left", fullHD)).toEqual({
      x: 0,
      y: 0,
      width: 960,
      height: 540,
    });
  });
  it("center is 1/2x1/2 centered", () => {
    expect(computeBounds("center", fullHD)).toEqual({
      x: 480,
      y: 270,
      width: 960,
      height: 540,
    });
  });
  it("fullscreen matches display", () => {
    expect(computeBounds("fullscreen", fullHD)).toEqual(fullHD);
  });
  it("thirds add up to full width", () => {
    const a = computeBounds("left-third", fullHD);
    const b = computeBounds("center-third", fullHD);
    const c = computeBounds("right-third", fullHD);
    expect(a.width + b.width + c.width).toBe(1920);
    expect(a.x).toBe(0);
    expect(c.x + c.width).toBe(1920);
  });
  it("offset displays", () => {
    const off: Rect = { x: 1920, y: 0, width: 1280, height: 720 };
    expect(computeBounds("left-half", off)).toEqual({
      x: 1920,
      y: 0,
      width: 640,
      height: 720,
    });
  });
  it("throws on unknown", () => {
    expect(() => computeBounds("xxx" as never, fullHD)).toThrow();
  });
});

describe("nextDisplay", () => {
  const d1: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
  const d2: Rect = { x: 1920, y: 0, width: 1280, height: 720 };
  it("returns null when only one display", () => {
    expect(nextDisplay(d1, [d1], "next")).toBeNull();
  });
  it("cycles forward", () => {
    expect(nextDisplay(d1, [d1, d2], "next")).toEqual(d2);
    expect(nextDisplay(d2, [d1, d2], "next")).toEqual(d1);
  });
  it("cycles backward", () => {
    expect(nextDisplay(d1, [d1, d2], "prev")).toEqual(d2);
  });
});
