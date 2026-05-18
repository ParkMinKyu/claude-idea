import { describe, it, expect } from "vitest";
import {
  chargePool,
  topUpPool,
  qualityScore,
  rewardFor,
  pickPayoutChannel,
  settleResponse,
} from "../src/incentive.js";

describe("pool operations", () => {
  it("charges and tracks spend", () => {
    const next = chargePool({ balance: 1000, spent: 0 }, 200);
    expect(next.balance).toBe(800);
    expect(next.spent).toBe(200);
  });
  it("rejects overdraft", () => {
    expect(() => chargePool({ balance: 100 }, 200)).toThrow(/insufficient/);
  });
  it("tops up balance", () => {
    const p = topUpPool({ balance: 100 }, 500, 10);
    expect(p.balance).toBe(600);
    expect(p.topUps).toHaveLength(1);
  });
});

describe("qualityScore", () => {
  it("full score for normal response", () => {
    const r = {
      answers: [
        { qid: 1, value: 4, msSpent: 9000 },
        { qid: 2, value: 3, msSpent: 9000 },
        { qid: 3, value: "great product, would buy again", msSpent: 12000 },
      ],
    };
    expect(qualityScore(r)).toBe(100);
  });
  it("penalizes too-fast responses", () => {
    const r = {
      answers: [
        { qid: 1, value: 4, msSpent: 200 },
        { qid: 2, value: 3, msSpent: 200 },
        { qid: 3, value: "ok", msSpent: 200 },
      ],
    };
    expect(qualityScore(r)).toBeLessThan(60);
  });
  it("detects straightlining", () => {
    const r = {
      answers: [
        { qid: 1, value: 3, msSpent: 9000 },
        { qid: 2, value: 3, msSpent: 9000 },
        { qid: 3, value: 3, msSpent: 9000 },
        { qid: 4, value: 3, msSpent: 9000 },
      ],
    };
    expect(qualityScore(r)).toBeLessThanOrEqual(70);
  });
  it("zero when honeypot triggered", () => {
    expect(qualityScore({ honeypot: true, answers: [{ value: 1, msSpent: 9000 }] })).toBe(0);
  });
});

describe("rewardFor", () => {
  it("zero when low quality", () => {
    expect(rewardFor(30, 1000)).toBe(0);
  });
  it("half when medium", () => {
    expect(rewardFor(60, 1000)).toBe(500);
  });
  it("full when high", () => {
    expect(rewardFor(85, 1000)).toBe(1000);
  });
});

describe("pickPayoutChannel", () => {
  it("kakao for small amounts", () => {
    expect(pickPayoutChannel(3000)).toBe("kakao_gifticon");
  });
  it("bank for larger", () => {
    expect(pickPayoutChannel(10000)).toBe("bank_transfer");
  });
});

describe("settleResponse", () => {
  it("debits pool and produces payout", () => {
    const pool = { balance: 10_000, spent: 0 };
    const r = {
      respondentId: "u1",
      answers: [
        { qid: 1, value: 4, msSpent: 9000 },
        { qid: 2, value: 5, msSpent: 9000 },
        { qid: 3, value: "valuable feedback", msSpent: 12000 },
      ],
    };
    const out = settleResponse(pool, r, 2000);
    expect(out.payout.amount).toBe(2000);
    expect(out.pool.balance).toBe(10_000 - 2000 - Math.ceil(2000 * 0.15));
  });
  it("no payout on bad response", () => {
    const pool = { balance: 10_000, spent: 0 };
    const out = settleResponse(pool, { honeypot: true, answers: [{ value: 1, msSpent: 100 }] }, 2000);
    expect(out.payout).toBeNull();
    expect(out.pool.balance).toBe(10_000);
  });
});
