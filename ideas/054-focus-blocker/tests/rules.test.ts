import { describe, it, expect } from "vitest";
import { diffRuleIds, toDnrRules } from "../src/lib/rules";
import { BlockRule } from "../src/lib/schedule";

const mk = (id: string, pattern: string): BlockRule => ({
  id,
  pattern,
  enabled: true,
  windows: [],
});

describe("toDnrRules", () => {
  it("maps to DNR shape", () => {
    const out = toDnrRules([mk("a", "*://x/*"), mk("b", "*://y/*")]);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe(1);
    expect(out[1].id).toBe(2);
    expect(out[0].condition.urlFilter).toBe("*://x/*");
    expect(out[0].action.type).toBe("redirect");
  });
  it("honours startId", () => {
    const out = toDnrRules([mk("a", "x")], "/blocked.html", 100);
    expect(out[0].id).toBe(100);
  });
});

describe("diffRuleIds", () => {
  it("computes add/remove", () => {
    const prev = toDnrRules([mk("a", "x"), mk("b", "y")]);
    const next = toDnrRules([mk("b", "y"), mk("c", "z")]);
    const { addRules, removeRuleIds } = diffRuleIds(prev, next);
    expect(removeRuleIds).toContain(1);
    expect(removeRuleIds).toContain(2);
    expect(addRules.length).toBe(2);
  });
});
