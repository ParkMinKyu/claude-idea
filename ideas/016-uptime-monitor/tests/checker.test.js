import { describe, it, expect } from "vitest";
import { checkMonitor, shouldAlert, runCycle } from "../src/checker.js";

const fakeFetch = (status, delay = 0) => async () => {
  if (delay) await new Promise((r) => setTimeout(r, delay));
  return { status };
};

describe("checkMonitor", () => {
  it("marks monitor up on expected status", async () => {
    const result = await checkMonitor({ url: "https://x", expectedStatus: 200 }, fakeFetch(200));
    expect(result.up).toBe(true);
    expect(result.status).toBe(200);
  });

  it("marks monitor down on mismatched status", async () => {
    const result = await checkMonitor({ url: "https://x", expectedStatus: 200 }, fakeFetch(500));
    expect(result.up).toBe(false);
    expect(result.status).toBe(500);
  });
});

describe("shouldAlert debounce", () => {
  it("does not alert on single failure when debounce is 2", () => {
    const { notify, nextState } = shouldAlert({}, { up: false }, 2);
    expect(notify).toBeNull();
    expect(nextState.failStreak).toBe(1);
  });

  it("alerts on second consecutive failure", () => {
    const { notify } = shouldAlert({ failStreak: 1 }, { up: false }, 2);
    expect(notify).toBe("down");
  });

  it("sends recovery notification when previously down", () => {
    const { notify } = shouldAlert({ failStreak: 3, lastNotifiedDown: true }, { up: true }, 2);
    expect(notify).toBe("up");
  });
});

describe("runCycle", () => {
  it("processes multiple monitors and updates store", async () => {
    const store = new Map();
    const monitors = [
      { id: "a", url: "https://a", expectedStatus: 200, debounce: 1 },
      { id: "b", url: "https://b", expectedStatus: 200, debounce: 1 },
    ];
    const out = await runCycle(monitors, store, fakeFetch(200));
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.result.up)).toBe(true);
  });
});
