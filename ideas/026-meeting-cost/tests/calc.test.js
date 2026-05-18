import { describe, it, expect } from "vitest";
import { hourlyRate, meetingCost, liveCostAt, formatCurrency, shareCardPayload } from "../src/calc.js";

describe("hourlyRate", () => {
  it("computes from annual salary", () => {
    expect(hourlyRate(60_000_000)).toBe(30_000); // 60M / 2000
  });
  it("rejects negative", () => {
    expect(() => hourlyRate(-1)).toThrow();
  });
});

describe("meetingCost", () => {
  it("rounds total cost", () => {
    // 5 people * 30,000 KRW/hr * 1hr = 150,000
    expect(meetingCost({ participants: 5, avgSalary: 60_000_000, durationMs: 3_600_000 })).toBe(150_000);
  });
  it("scales with duration", () => {
    expect(meetingCost({ participants: 2, avgSalary: 60_000_000, durationMs: 1_800_000 })).toBe(30_000);
  });
  it("zero with no participants", () => {
    expect(meetingCost({ participants: 0, avgSalary: 60_000_000, durationMs: 3_600_000 })).toBe(0);
  });
});

describe("liveCostAt", () => {
  it("computes from start/now timestamps", () => {
    const start = new Date("2026-05-18T10:00:00Z");
    const now = new Date("2026-05-18T11:00:00Z");
    expect(liveCostAt(start, now, 5, 60_000_000)).toBe(150_000);
  });
  it("clamps to 0 when now < start", () => {
    expect(liveCostAt(2000, 1000, 5, 60_000_000)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats KRW without decimals", () => {
    expect(formatCurrency(150_000, "KRW", "ko-KR")).toMatch(/150,000/);
  });
  it("formats USD with two decimals", () => {
    const s = formatCurrency(99.5, "USD", "en-US");
    expect(s).toMatch(/\$99\.50/);
  });
});

describe("shareCardPayload", () => {
  it("chooses red for huge cost", () => {
    const p = shareCardPayload({ participants: 100, durationMs: 7_200_000, cost: 2_000_000 });
    expect(p.bg).toBe("#dc2626");
  });
  it("uses minutes in subtitle", () => {
    const p = shareCardPayload({ participants: 4, durationMs: 1_800_000, cost: 10 });
    expect(p.subtitle).toMatch(/30분/);
  });
});
