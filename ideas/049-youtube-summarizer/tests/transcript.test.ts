import { describe, it, expect } from "vitest";
import {
  cuesToText,
  extractVideoId,
  fmt,
  parseJson3,
  parseXml,
} from "../src/lib/transcript";

describe("extractVideoId", () => {
  it("extracts from watch?v=", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=abc123")).toBe("abc123");
  });
  it("extracts from youtu.be", () => {
    expect(extractVideoId("https://youtu.be/xyz789")).toBe("xyz789");
  });
  it("returns null for invalid", () => {
    expect(extractVideoId("not a url")).toBeNull();
    expect(extractVideoId("https://example.com")).toBeNull();
  });
});

describe("parseJson3", () => {
  it("parses events with segs", () => {
    const cues = parseJson3({
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello" }, { utf8: " world" }] },
        { tStartMs: 2000, dDurationMs: 1500, segs: [{ utf8: "Next" }] },
      ],
    });
    expect(cues).toEqual([
      { start: 0, duration: 1, text: "Hello world" },
      { start: 2, duration: 1.5, text: "Next" },
    ]);
  });
  it("skips empty events", () => {
    expect(parseJson3({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [] }] })).toEqual([]);
  });
});

describe("parseXml", () => {
  it("parses xml cues", () => {
    const xml = `<transcript><text start="0.5" dur="2.0">Hello &amp; bye</text></transcript>`;
    expect(parseXml(xml)).toEqual([{ start: 0.5, duration: 2, text: "Hello & bye" }]);
  });
});

describe("fmt", () => {
  it("formats m:ss", () => expect(fmt(75)).toBe("1:15"));
  it("formats h:mm:ss", () => expect(fmt(3661)).toBe("1:01:01"));
});

describe("cuesToText", () => {
  it("renders timestamps", () => {
    expect(
      cuesToText([
        { start: 0, duration: 1, text: "a" },
        { start: 60, duration: 1, text: "b" },
      ])
    ).toBe("[0:00] a\n[1:00] b");
  });
});
