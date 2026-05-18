import { describe, it, expect } from "vitest";
import { classify, mergeSegments, dailyReport, defaultRules } from "../src/tracker.js";

describe("classify", () => {
  it("matches code editors", () => {
    expect(classify({ app: "Visual Studio Code", title: "x" }, defaultRules)).toBe("code");
  });
  it("matches communication apps", () => {
    expect(classify({ app: "Slack", title: "" }, defaultRules)).toBe("communication");
  });
  it("falls back to uncategorized", () => {
    expect(classify({ app: "WeirdApp", title: "" }, defaultRules)).toBe("uncategorized");
  });
});

describe("mergeSegments", () => {
  it("merges contiguous events for same app/title", () => {
    const base = Date.now();
    const events = [
      { at: base, app: "Code", title: "main.js", idle: false },
      { at: base + 5000, app: "Code", title: "main.js", idle: false },
      { at: base + 10000, app: "Code", title: "main.js", idle: false },
    ];
    const segs = mergeSegments(events);
    expect(segs).toHaveLength(1);
    expect(segs[0].durationMs).toBe(10000);
  });

  it("breaks segment on app switch", () => {
    const base = Date.now();
    const events = [
      { at: base, app: "Code", title: "x", idle: false },
      { at: base + 5000, app: "Slack", title: "y", idle: false },
    ];
    expect(mergeSegments(events)).toHaveLength(2);
  });

  it("ignores idle events", () => {
    const events = [
      { at: 1, app: "Code", title: "", idle: true },
      { at: 2, app: "Code", title: "", idle: true },
    ];
    expect(mergeSegments(events)).toEqual([]);
  });
});

describe("dailyReport", () => {
  it("aggregates totals and topApps", () => {
    const segs = [
      { app: "Code", title: "a", startsAt: 0, endsAt: 60000, durationMs: 60000 },
      { app: "Slack", title: "b", startsAt: 0, endsAt: 30000, durationMs: 30000 },
      { app: "Code", title: "c", startsAt: 0, endsAt: 120000, durationMs: 120000 },
    ];
    const r = dailyReport(segs);
    expect(r.totalMs).toBe(210000);
    expect(r.topApps[0].app).toBe("Code");
    expect(r.byCategory.code).toBe(180000);
  });
});
