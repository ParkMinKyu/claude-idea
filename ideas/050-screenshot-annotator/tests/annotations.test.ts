import { describe, it, expect } from "vitest";
import { bbox, hitTest, History, Shape } from "../src/lib/annotations";

const rect: Shape = {
  id: "1",
  tool: "rect",
  color: "#000",
  strokeWidth: 2,
  x: 10,
  y: 20,
  w: 30,
  h: 40,
};

const arrow: Shape = {
  id: "2",
  tool: "arrow",
  color: "#000",
  strokeWidth: 2,
  x1: 100,
  y1: 200,
  x2: 50,
  y2: 250,
};

describe("bbox", () => {
  it("rect bbox", () => expect(bbox(rect)).toEqual({ x: 10, y: 20, w: 30, h: 40 }));
  it("arrow bbox (normalised)", () =>
    expect(bbox(arrow)).toEqual({ x: 50, y: 200, w: 50, h: 50 }));
});

describe("hitTest", () => {
  it("inside rect", () => expect(hitTest(rect, 20, 30)).toBe(true));
  it("outside rect", () => expect(hitTest(rect, 100, 100)).toBe(false));
});

describe("History", () => {
  it("starts empty", () => {
    const h = new History();
    expect(h.current()).toEqual([]);
  });
  it("push / undo / redo", () => {
    const h = new History();
    h.push([rect]);
    h.push([rect, arrow]);
    expect(h.current()).toHaveLength(2);
    expect(h.undo()).toBe(true);
    expect(h.current()).toHaveLength(1);
    expect(h.redo()).toBe(true);
    expect(h.current()).toHaveLength(2);
  });
  it("redo invalidates on new push", () => {
    const h = new History();
    h.push([rect]);
    h.undo();
    h.push([arrow]);
    expect(h.redo()).toBe(false);
  });
});
