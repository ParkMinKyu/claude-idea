import { describe, it, expect } from "vitest";
import { nextRunAt, activeMembers, buildPromptBlocks, summarizeResponses } from "../src/standup.js";

describe("nextRunAt", () => {
  it("schedules later today when time is in future", () => {
    const now = new Date("2026-05-18T09:00:00"); // a Monday
    const next = nextRunAt({ time: "10:00", weekdays: ["mon", "tue", "wed", "thu", "fri"] }, now);
    expect(next.getDate()).toBe(now.getDate());
    expect(next.getHours()).toBe(10);
  });
  it("skips weekend", () => {
    const now = new Date("2026-05-22T11:00:00"); // Friday after standup
    const next = nextRunAt({ time: "10:00", weekdays: ["mon", "tue", "wed", "thu", "fri"] }, now);
    expect(next.getDay()).toBe(1); // Monday
  });
});

describe("activeMembers", () => {
  const members = [
    { userId: "U1", active: true },
    { userId: "U2", active: true },
    { userId: "U3", active: false },
  ];
  it("excludes inactive", () => {
    expect(activeMembers(members, []).map((m) => m.userId)).toEqual(["U1", "U2"]);
  });
  it("excludes those on vacation today", () => {
    const vac = [{ userId: "U1", from: "2026-05-18", to: "2026-05-20" }];
    const out = activeMembers(members, vac, new Date("2026-05-19"));
    expect(out.map((m) => m.userId)).toEqual(["U2"]);
  });
});

describe("buildPromptBlocks", () => {
  it("creates one input block per question", () => {
    const blocks = buildPromptBlocks(["어제 한 일?", "오늘 할 일?", "블로커?"]);
    const inputs = blocks.filter((b) => b.type === "input");
    expect(inputs).toHaveLength(3);
  });
  it("includes submit + skip actions", () => {
    const blocks = buildPromptBlocks(["q1"]);
    const actions = blocks.find((b) => b.type === "actions");
    expect(actions.elements.map((e) => e.action_id).sort()).toEqual(["skip", "submit"]);
  });
  it("throws when empty", () => {
    expect(() => buildPromptBlocks([])).toThrow();
  });
});

describe("summarizeResponses", () => {
  const standup = {
    members: [{ userId: "U1" }, { userId: "U2" }, { userId: "U3" }],
    questions: ["Q1", "Q2"],
  };
  it("includes response rate and missing users", () => {
    const responses = [
      { userId: "U1", answers: ["did a", "do b"] },
      { userId: "U2", answers: ["x", "y"] },
    ];
    const out = summarizeResponses(standup, responses);
    expect(out.responseRate).toBe(67);
    expect(out.missingUsers).toEqual(["U3"]);
    expect(out.text).toMatch(/U3/);
    expect(out.text).toMatch(/미응답/);
  });
});
