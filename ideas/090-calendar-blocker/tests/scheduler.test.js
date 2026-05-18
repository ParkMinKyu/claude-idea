import { describe, it, expect } from "vitest";
import { freeSlots, scheduleBlocks, detectIntrusion, suggestAction } from "../src/scheduler.js";

const d = (h, m = 0) => new Date(`2026-05-18T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);

describe("freeSlots", () => {
  it("returns whole window when no events", () => {
    const slots = freeSlots({ start: d(9), end: d(17) }, []);
    expect(slots).toHaveLength(1);
    expect(slots[0].end.getHours()).toBe(17);
  });

  it("splits around a midday meeting", () => {
    const slots = freeSlots({ start: d(9), end: d(17) }, [{ start: d(12), end: d(13) }]);
    expect(slots).toHaveLength(2);
    expect(slots[0].end.getHours()).toBe(12);
    expect(slots[1].start.getHours()).toBe(13);
  });

  it("clips events outside the window", () => {
    const slots = freeSlots({ start: d(9), end: d(17) }, [{ start: d(8), end: d(10) }]);
    expect(slots[0].start.getHours()).toBe(10);
  });
});

describe("scheduleBlocks", () => {
  it("fills target minutes greedily", () => {
    const slots = freeSlots({ start: d(9), end: d(17) }, [{ start: d(12), end: d(13) }]);
    const result = scheduleBlocks(slots, { targetMinutes: 180, minBlockMinutes: 60, preferStart: 9 });
    expect(result.scheduledMinutes).toBe(180);
    expect(result.shortfall).toBe(0);
  });

  it("reports shortfall when slots are too small", () => {
    const slots = [{ start: d(9), end: d(9, 30) }];
    const result = scheduleBlocks(slots, { targetMinutes: 60, minBlockMinutes: 60 });
    expect(result.shortfall).toBe(60);
  });
});

describe("detectIntrusion", () => {
  it("detects overlap with existing block", () => {
    const block = { start: d(10), end: d(12) };
    const intr = detectIntrusion([block], { start: d(11), end: d(11, 30) });
    expect(intr).toHaveLength(1);
  });

  it("returns empty when no overlap", () => {
    const block = { start: d(10), end: d(12) };
    expect(detectIntrusion([block], { start: d(13), end: d(14) })).toEqual([]);
  });
});

describe("suggestAction", () => {
  it("accepts short meetings", () => {
    const action = suggestAction({ start: d(10), end: d(10, 10), attendees: [] }, { maxDurationMin: 15 });
    expect(action).toBe("accept");
  });
  it("proposes move for long meetings", () => {
    const action = suggestAction({ start: d(10), end: d(11), attendees: [] }, { maxDurationMin: 15 });
    expect(action).toBe("propose-move");
  });
  it("accepts VIP attendees regardless of duration", () => {
    const action = suggestAction(
      { start: d(10), end: d(11), attendees: ["ceo@x.com"] },
      { allowAttendees: ["ceo@x.com"], maxDurationMin: 15 }
    );
    expect(action).toBe("accept");
  });
});
