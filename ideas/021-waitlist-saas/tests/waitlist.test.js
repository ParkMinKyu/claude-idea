import { describe, it, expect } from "vitest";
import {
  generateRefCode,
  isDisposableEmail,
  validateEmail,
  rankEntries,
  positionFor,
  selectInvitees,
  applyReferral,
  BOOST_MS,
} from "../src/waitlist.js";

describe("generateRefCode", () => {
  it("produces 8 char code from safe alphabet", () => {
    const code = generateRefCode(42);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });
  it("deterministic with same seed", () => {
    expect(generateRefCode(123)).toBe(generateRefCode(123));
  });
});

describe("email", () => {
  it("rejects invalid format", () => {
    expect(validateEmail("nope")).toMatch(/invalid/);
  });
  it("rejects disposable", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(validateEmail("x@mailinator.com")).toMatch(/disposable/);
  });
  it("accepts good email", () => {
    expect(validateEmail("hi@example.com")).toBeNull();
  });
});

describe("rankEntries with referral boost", () => {
  const base = Date.parse("2026-05-18T00:00:00Z");
  it("boosts entry with referrals above later signup", () => {
    const entries = [
      { id: "a", email: "a@x", joinedAt: base, referrals: 0 },
      { id: "b", email: "b@x", joinedAt: base + 60_000, referrals: 0 },
      { id: "c", email: "c@x", joinedAt: base + 120_000, referrals: 5 },
    ];
    const ranked = rankEntries(entries);
    expect(ranked[0].id).toBe("c"); // 5 hours boost beats 2-minute later signup
  });
  it("tie-breaks by id deterministically", () => {
    const entries = [
      { id: "b", email: "b@x", joinedAt: base, referrals: 0 },
      { id: "a", email: "a@x", joinedAt: base, referrals: 0 },
    ];
    const ranked = rankEntries(entries);
    expect(ranked[0].id).toBe("a");
  });
});

describe("positionFor + selectInvitees", () => {
  const base = Date.parse("2026-05-18T00:00:00Z");
  const entries = [
    { id: "a", email: "a@x", joinedAt: base, referrals: 0 },
    { id: "b", email: "b@x", joinedAt: base + 1000, referrals: 0 },
    { id: "c", email: "c@x", joinedAt: base + 2000, referrals: 0 },
  ];
  it("returns rank + total", () => {
    expect(positionFor(entries, "b")).toEqual({ rank: 2, total: 3 });
  });
  it("picks top N uninvited", () => {
    const picks = selectInvitees(entries, { count: 2, alreadyInvited: new Set(["a"]) });
    expect(picks.map((p) => p.id)).toEqual(["b", "c"]);
  });
});

describe("applyReferral", () => {
  it("increments referral count for matching code", () => {
    const e = [{ id: "a", refCode: "X", referrals: 0 }, { id: "b", refCode: "Y", referrals: 1 }];
    const updated = applyReferral(e, "X");
    expect(updated[0].referrals).toBe(1);
    expect(updated[1].referrals).toBe(1);
  });
});

describe("BOOST_MS", () => {
  it("is 1 hour", () => {
    expect(BOOST_MS).toBe(60 * 60 * 1000);
  });
});
