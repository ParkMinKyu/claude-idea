import { describe, it, expect } from "vitest";
import {
  DEFAULT_CFG,
  fmtMs,
  nextPhase,
  phaseDuration,
  PomodoroTimer,
} from "../src/main/timer";

describe("nextPhase", () => {
  it("idle -> focus", () => {
    expect(nextPhase("idle", 0, DEFAULT_CFG)).toBe("focus");
  });
  it("focus -> shortBreak normally", () => {
    expect(nextPhase("focus", 1, DEFAULT_CFG)).toBe("shortBreak");
  });
  it("focus -> longBreak after 4 sessions", () => {
    expect(nextPhase("focus", 4, DEFAULT_CFG)).toBe("longBreak");
  });
  it("break -> focus", () => {
    expect(nextPhase("shortBreak", 1, DEFAULT_CFG)).toBe("focus");
    expect(nextPhase("longBreak", 4, DEFAULT_CFG)).toBe("focus");
  });
});

describe("phaseDuration", () => {
  it("focus 25m", () => expect(phaseDuration("focus", DEFAULT_CFG)).toBe(25 * 60_000));
  it("longBreak 15m", () =>
    expect(phaseDuration("longBreak", DEFAULT_CFG)).toBe(15 * 60_000));
  it("idle 0", () => expect(phaseDuration("idle", DEFAULT_CFG)).toBe(0));
});

describe("fmtMs", () => {
  it("formats min:sec", () => expect(fmtMs(125_000)).toBe("02:05"));
  it("floors negatives to 00:00", () => expect(fmtMs(-1000)).toBe("00:00"));
});

describe("PomodoroTimer", () => {
  it("emits phase-end when focus expires", () => {
    const t = new PomodoroTimer({ ...DEFAULT_CFG, focusMs: 0, shortBreakMs: 0, longBreakMs: 0 });
    let ended: string | null = null;
    t.on("phase-end", (e) => {
      ended ??= e.phase;
    });
    t.start("test");
    // tick manually
    (t as unknown as { tick(): void }).tick();
    t.pause();
    expect(ended).toBe("focus");
    expect(t.completedSessions()).toBe(1);
  });
});
