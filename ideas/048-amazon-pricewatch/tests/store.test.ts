import { describe, it, expect } from "vitest";
import { appendPrice, shouldNotify, upsert, TrackedProduct } from "../src/lib/store";

function mk(over: Partial<TrackedProduct> = {}): TrackedProduct {
  return {
    asin: "A1",
    url: "https://x",
    title: "T",
    currency: "USD",
    addedAt: 0,
    history: [],
    ...over,
  };
}

describe("upsert", () => {
  it("inserts new", () => {
    expect(upsert([], mk())).toHaveLength(1);
  });
  it("updates existing", () => {
    const arr = [mk({ title: "Old" })];
    const out = upsert(arr, mk({ title: "New" }));
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("New");
  });
});

describe("appendPrice", () => {
  it("appends and caps history", () => {
    let p = mk();
    for (let i = 0; i < 250; i++) p = appendPrice(p, i, i);
    expect(p.history).toHaveLength(200);
    expect(p.history[0].amount).toBe(50);
  });
});

describe("shouldNotify", () => {
  it("notifies when price hits target", () => {
    const p = mk({ targetPrice: 10, history: [{ at: 0, amount: 15 }] });
    expect(shouldNotify(p, 9)).toBe(true);
  });
  it("does not notify if previous already below target", () => {
    const p = mk({ targetPrice: 10, history: [{ at: 0, amount: 9 }] });
    expect(shouldNotify(p, 8)).toBe(false);
  });
  it("does not notify when above target", () => {
    const p = mk({ targetPrice: 10, history: [{ at: 0, amount: 20 }] });
    expect(shouldNotify(p, 11)).toBe(false);
  });
  it("does not notify when no target", () => {
    expect(shouldNotify(mk(), 1)).toBe(false);
  });
});
