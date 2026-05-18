import { describe, it, expect } from "vitest";
import { parseSummary, timestampToSeconds } from "../src/lib/summarize";

describe("timestampToSeconds", () => {
  it("parses m:ss", () => expect(timestampToSeconds("1:30")).toBe(90));
  it("parses h:mm:ss", () => expect(timestampToSeconds("1:01:01")).toBe(3661));
});

describe("parseSummary", () => {
  it("parses JSON embedded in text", () => {
    const raw = `Here you go:\n{"tldr":"x","chapters":[{"title":"Intro","startSeconds":0}],"quotes":["q"]}`;
    const out = parseSummary(raw);
    expect(out.tldr).toBe("x");
    expect(out.chapters[0]).toEqual({ title: "Intro", startSeconds: 0 });
    expect(out.quotes).toEqual(["q"]);
  });

  it("coerces missing fields", () => {
    const out = parseSummary(`{"tldr":"x"}`);
    expect(out.chapters).toEqual([]);
    expect(out.quotes).toEqual([]);
  });

  it("throws when no JSON", () => {
    expect(() => parseSummary("plain text")).toThrow();
  });
});
