import { describe, it, expect } from "vitest";
import {
  activeRules,
  BlockRule,
  isActive,
  isRuleActive,
  parseHHMM,
} from "../src/lib/schedule";

const monAt = (h: number, m = 0) => new Date(Date.UTC(2026, 4, 18, h, m)); // 2026-05-18 was Monday (UTC).
// Build a date with local h/m for stable tests:
const local = (year: number, month: number, day: number, h: number, m = 0) =>
  new Date(year, month - 1, day, h, m);

describe("parseHHMM", () => {
  it("parses HH:MM", () => expect(parseHHMM("09:30")).toBe(570));
  it("rejects invalid", () => expect(() => parseHHMM("25:00")).toThrow());
});

describe("isActive", () => {
  it("active within window", () => {
    const w = { days: [1 as const], startMin: 9 * 60, endMin: 18 * 60 };
    expect(isActive(w, local(2026, 5, 18, 10, 0))).toBe(true);
  });
  it("inactive outside window", () => {
    const w = { days: [1 as const], startMin: 9 * 60, endMin: 18 * 60 };
    expect(isActive(w, local(2026, 5, 18, 8, 59))).toBe(false);
    expect(isActive(w, local(2026, 5, 18, 18, 0))).toBe(false);
  });
  it("wrap-around (night)", () => {
    const w = { days: [1 as const], startMin: 22 * 60, endMin: 6 * 60 };
    expect(isActive(w, local(2026, 5, 18, 23, 0))).toBe(true);
    expect(isActive(w, local(2026, 5, 18, 5, 0))).toBe(true);
    expect(isActive(w, local(2026, 5, 18, 12, 0))).toBe(false);
  });
  it("respects day-of-week", () => {
    const w = { days: [0 as const], startMin: 0, endMin: 1440 };
    expect(isActive(w, local(2026, 5, 17, 12, 0))).toBe(true); // Sunday
    expect(isActive(w, local(2026, 5, 18, 12, 0))).toBe(false);
  });
});

describe("isRuleActive", () => {
  const rule: BlockRule = {
    id: "r1",
    pattern: "*://*.twitter.com/*",
    enabled: true,
    windows: [{ days: [1, 2, 3, 4, 5], startMin: 540, endMin: 1080 }],
  };
  it("active when enabled + window matches", () => {
    expect(isRuleActive(rule, local(2026, 5, 18, 10))).toBe(true);
  });
  it("inactive when disabled", () => {
    expect(isRuleActive({ ...rule, enabled: false }, local(2026, 5, 18, 10))).toBe(false);
  });
});

describe("activeRules", () => {
  it("returns subset", () => {
    const r1: BlockRule = {
      id: "1",
      pattern: "p1",
      enabled: true,
      windows: [{ days: [1], startMin: 0, endMin: 1440 }],
    };
    const r2: BlockRule = {
      id: "2",
      pattern: "p2",
      enabled: true,
      windows: [{ days: [0], startMin: 0, endMin: 1440 }],
    };
    expect(activeRules([r1, r2], local(2026, 5, 18, 12)).map((r) => r.id)).toEqual(["1"]);
  });
});
