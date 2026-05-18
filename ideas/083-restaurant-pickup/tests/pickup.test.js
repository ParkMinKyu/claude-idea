import { describe, it, expect } from "vitest";
import {
  ORDER_STATES,
  computeItemPrice,
  computeOrderTotal,
  transitionOrder,
  estimateEtaMinutes,
  buildReadySms,
  nextShortCode,
} from "../src/pickup.js";

const americano = {
  id: "americano",
  name: "Americano",
  basePriceCents: 4000,
  optionGroups: [
    {
      name: "Size",
      required: true,
      max: 1,
      options: [
        { id: "size-r", name: "Regular", deltaCents: 0 },
        { id: "size-l", name: "Large", deltaCents: 500 },
      ],
    },
    {
      name: "Shots",
      max: 2,
      options: [
        { id: "shot-1", name: "+1 shot", deltaCents: 500 },
        { id: "shot-2", name: "+2 shots", deltaCents: 1000 },
      ],
    },
  ],
};

const menu = [americano, { id: "cookie", name: "Cookie", basePriceCents: 2500 }];

describe("computeItemPrice", () => {
  it("requires required group", () => {
    expect(() => computeItemPrice(americano, [])).toThrow(/required/);
  });
  it("respects max selection", () => {
    expect(() => computeItemPrice(americano, ["size-r", "shot-1", "shot-2"])).not.toThrow();
    expect(() => computeItemPrice(americano, ["size-r", "size-l"])).toThrow(/max/);
  });
  it("sums base + option deltas", () => {
    const price = computeItemPrice(americano, ["size-l", "shot-1"]);
    expect(price).toBe(4000 + 500 + 500);
  });
});

describe("computeOrderTotal", () => {
  it("sums lines and rejects sold out items", () => {
    const out = computeOrderTotal(menu, [
      { itemId: "americano", optionIds: ["size-r"], quantity: 2 },
      { itemId: "cookie", quantity: 1 },
    ]);
    expect(out.subtotal).toBe(4000 * 2 + 2500);
    expect(out.lines).toHaveLength(2);
    const soldOutMenu = [...menu, { id: "x", name: "x", basePriceCents: 1, soldOut: true }];
    expect(() => computeOrderTotal(soldOutMenu, [{ itemId: "x" }])).toThrow();
  });
});

describe("transitionOrder", () => {
  it("walks the happy path", () => {
    let s = ORDER_STATES.PENDING_PAYMENT;
    s = transitionOrder(s, "paid");
    s = transitionOrder(s, "start");
    s = transitionOrder(s, "ready");
    s = transitionOrder(s, "pickup");
    expect(s).toBe(ORDER_STATES.PICKED_UP);
  });
  it("rejects invalid transition", () => {
    expect(() => transitionOrder(ORDER_STATES.READY, "cancel")).toThrow();
  });
});

describe("estimateEtaMinutes", () => {
  it("scales with queue size", () => {
    const orders = [
      { state: ORDER_STATES.PREPARING, lines: [{ qty: 2 }] },
      { state: ORDER_STATES.PAID, lines: [{ qty: 1 }] },
      { state: ORDER_STATES.PICKED_UP, lines: [{ qty: 5 }] }, // ignored
    ];
    const eta = estimateEtaMinutes(orders, 3, 5);
    expect(eta).toBe(5 + (2 + 1) * 3);
  });
});

describe("buildReadySms / nextShortCode", () => {
  it("includes order info in SMS", () => {
    const sms = buildReadySms(
      { shortCode: "0012", lines: [{ name: "Americano", qty: 2 }] },
      { name: "Cozy Cafe", address: "Seoul, Mapo" }
    );
    expect(sms).toContain("Cozy Cafe");
    expect(sms).toContain("0012");
    expect(sms).toContain("Americano×2");
  });
  it("rolls short codes correctly", () => {
    expect(nextShortCode(undefined)).toBe("0001");
    expect(nextShortCode("0099")).toBe("0100");
    expect(nextShortCode("9999")).toBe("0000");
  });
});
