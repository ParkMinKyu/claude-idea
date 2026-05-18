import { describe, it, expect } from "vitest";
import {
  filterRange,
  focusMinutes,
  groupByDay,
  groupByLabel,
  trimForFree,
} from "../src/main/stats";

const day = (iso: string) => new Date(iso).getTime();

const entries = [
  { label: "work", startedAt: day("2026-05-10T09:00:00Z"), endedAt: day("2026-05-10T09:25:00Z") },
  { label: "work", startedAt: day("2026-05-10T10:00:00Z"), endedAt: day("2026-05-10T10:25:00Z") },
  { label: "study", startedAt: day("2026-05-11T09:00:00Z"), endedAt: day("2026-05-11T09:25:00Z") },
];

describe("focusMinutes", () => {
  it("sums minutes", () => expect(focusMinutes(entries)).toBe(75));
});

describe("groupByDay", () => {
  it("groups by ISO date", () => {
    expect(groupByDay(entries)).toEqual({ "2026-05-10": 50, "2026-05-11": 25 });
  });
});

describe("groupByLabel", () => {
  it("sums per label", () => {
    expect(groupByLabel(entries)).toEqual({ work: 50, study: 25 });
  });
  it("treats empty as (no label)", () => {
    expect(groupByLabel([{ label: "", startedAt: 0, endedAt: 60_000 }])).toEqual({
      "(no label)": 1,
    });
  });
});

describe("filterRange", () => {
  it("filters", () => {
    const f = filterRange(entries, day("2026-05-11T00:00:00Z"), day("2026-05-12T00:00:00Z"));
    expect(f).toHaveLength(1);
  });
});

describe("trimForFree", () => {
  it("removes old entries", () => {
    const now = day("2026-05-20T00:00:00Z");
    expect(trimForFree(entries, 7, now)).toHaveLength(0);
  });
  it("keeps recent", () => {
    const now = day("2026-05-12T00:00:00Z");
    expect(trimForFree(entries, 7, now)).toHaveLength(3);
  });
});
