import { describe, it, expect } from "vitest";
import { focusScore, bucketBy, blockerImpact, weeklyReport } from "../src/stats.js";

const min = (n) => n * 60 * 1000;

describe("focusScore", () => {
  it("returns 0 when no events", () => {
    expect(focusScore([])).toBe(0);
  });

  it("computes ratio of focus categories", () => {
    const events = [
      { category: "code", durationMs: min(60), idle: false, at: 0 },
      { category: "social", durationMs: min(40), idle: false, at: 0 },
    ];
    expect(focusScore(events)).toBe(60);
  });

  it("ignores idle events", () => {
    const events = [
      { category: "code", durationMs: min(30), idle: false, at: 0 },
      { category: "code", durationMs: min(30), idle: true, at: 0 },
    ];
    expect(focusScore(events)).toBe(100);
  });
});

describe("bucketBy", () => {
  it("groups events into time buckets", () => {
    const dayStart = new Date("2026-05-18T00:00:00");
    const events = [
      { at: +dayStart + min(10), durationMs: min(20), category: "code", idle: false },
      { at: +dayStart + min(35), durationMs: min(10), category: "code", idle: false },
      { at: +dayStart + min(90), durationMs: min(15), category: "social", idle: false },
    ];
    const buckets = bucketBy(events, min(30), dayStart);
    expect(buckets).toHaveLength(3);
    expect(buckets[0].byCategory.code).toBe(min(20));
    expect(buckets[2].byCategory.social).toBe(min(15));
  });
});

describe("blockerImpact", () => {
  it("counts attempts and saved time", () => {
    const blocks = [
      { url: "https://twitter.com", blockedDurationMs: min(2) },
      { url: "https://twitter.com", blockedDurationMs: min(3) },
      { url: "https://youtube.com", blockedDurationMs: min(5) },
    ];
    const r = blockerImpact(blocks);
    expect(r.attempts).toBe(3);
    expect(r.savedMs).toBe(min(10));
    expect(r.topHosts[0][0]).toBe("twitter.com");
  });
});

describe("weeklyReport", () => {
  it("aggregates days and goal progress", () => {
    const base = +new Date("2026-05-18T09:00:00");
    const events = [
      { at: base, durationMs: min(120), category: "code", idle: false },
      { at: base + min(120), durationMs: min(60), category: "social", idle: false },
      { at: base + 86400000, durationMs: min(90), category: "code", idle: false },
    ];
    const r = weeklyReport({ events, blocks: [], goalsMinutes: { code: 240 } });
    expect(r.days.length).toBe(2);
    expect(r.goalProgress.code.actual).toBe(210);
    expect(r.goalProgress.code.pct).toBe(88);
  });
});
