import { describe, it, expect, vi } from "vitest";
import { drawShape, render } from "../src/lib/render";
import { Shape } from "../src/lib/annotations";

function makeMockCtx() {
  const calls: string[] = [];
  const ctx = {
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    strokeRect: () => calls.push("strokeRect"),
    fillRect: () => calls.push("fillRect"),
    clearRect: () => calls.push("clearRect"),
    drawImage: () => calls.push("drawImage"),
    beginPath: () => calls.push("beginPath"),
    moveTo: () => calls.push("moveTo"),
    lineTo: () => calls.push("lineTo"),
    closePath: () => calls.push("closePath"),
    stroke: () => calls.push("stroke"),
    fill: () => calls.push("fill"),
    fillText: () => calls.push("fillText"),
    ellipse: () => calls.push("ellipse"),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    font: "",
    globalAlpha: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

describe("drawShape", () => {
  it("rect", () => {
    const { ctx, calls } = makeMockCtx();
    drawShape(ctx, {
      id: "1",
      tool: "rect",
      color: "#000",
      strokeWidth: 1,
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(calls).toContain("strokeRect");
  });
  it("text", () => {
    const { ctx, calls } = makeMockCtx();
    drawShape(ctx, {
      id: "1",
      tool: "text",
      color: "#000",
      strokeWidth: 1,
      x: 0,
      y: 0,
      text: "hi",
      font: "12px serif",
    });
    expect(calls).toContain("fillText");
  });
  it("arrow draws line and head", () => {
    const { ctx, calls } = makeMockCtx();
    drawShape(ctx, {
      id: "1",
      tool: "arrow",
      color: "#000",
      strokeWidth: 1,
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
    });
    expect(calls).toContain("lineTo");
    expect(calls).toContain("fill");
  });
});

describe("render", () => {
  it("clears and draws shapes", () => {
    const { ctx, calls } = makeMockCtx();
    const shapes: Shape[] = [
      { id: "1", tool: "rect", color: "#000", strokeWidth: 1, x: 0, y: 0, w: 1, h: 1 },
    ];
    render(ctx, null, shapes, 100, 100);
    expect(calls[0]).toBe("clearRect");
    expect(calls).toContain("strokeRect");
  });
});
