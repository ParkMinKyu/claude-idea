import { describe, it, expect } from "vitest";
import { parseCron, nextRun, nextRuns } from "../src/cron.js";
import { createScheduler } from "../src/scheduler.js";

const at = (iso) => new Date(iso);

describe("parseCron", () => {
  it("parses */15 step on minutes", () => {
    const p = parseCron("*/15 * * * *");
    expect([...p.minute].sort((a, b) => a - b)).toEqual([0, 15, 30, 45]);
  });

  it("parses ranges, lists and month names", () => {
    const p = parseCron("0 9-17 * jan,jul mon-fri");
    expect(p.hour.has(9)).toBe(true);
    expect(p.hour.has(18)).toBe(false);
    expect(p.month.has(1)).toBe(true);
    expect(p.month.has(7)).toBe(true);
    expect(p.dow.has(6)).toBe(false); // Saturday excluded
  });

  it("rejects malformed expressions", () => {
    expect(() => parseCron("* * * *")).toThrow();
    expect(() => parseCron("99 * * * *")).toThrow();
    expect(() => parseCron("*/0 * * * *")).toThrow();
  });
});

describe("nextRun", () => {
  it("computes the next minute boundary", () => {
    const p = parseCron("*/15 * * * *");
    const n = nextRun(p, at("2026-05-20T10:07:30Z"));
    expect(n.toISOString()).toBe("2026-05-20T10:15:00.000Z");
  });

  it("rolls to the next valid day", () => {
    const p = parseCron("0 0 1 * *"); // midnight on the 1st
    const n = nextRun(p, at("2026-05-20T10:00:00Z"));
    expect(n.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("nextRuns returns N ascending times", () => {
    const runs = nextRuns("0 * * * *", 3, at("2026-05-20T10:30:00Z"));
    expect(runs).toHaveLength(3);
    expect(runs[0].toISOString()).toBe("2026-05-20T11:00:00.000Z");
    expect(runs[2].toISOString()).toBe("2026-05-20T13:00:00.000Z");
  });
});

describe("scheduler", () => {
  it("fires due jobs and reschedules them", async () => {
    const fixed = at("2026-05-20T10:00:00Z");
    const sched = createScheduler({
      now: () => fixed,
      executor: async (job) => ({ ok: job.id }),
    });
    sched.addJob({ id: "j1", cron: "* * * * *", url: "https://x" });
    const fired = await sched.tick(at("2026-05-20T10:01:00Z"));
    expect(fired).toHaveLength(1);
    expect(fired[0].result.ok).toBe("j1");
    expect(sched.jobs.get("j1").nextAt.toISOString()).toBe("2026-05-20T10:02:00.000Z");
  });
});
