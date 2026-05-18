import { describe, it, expect } from "vitest";
import { buildPrompt, parseClaudeJson, organize, estimateCostUsd, toMarkdown } from "../src/organizer.js";

describe("buildPrompt", () => {
  it("includes the transcript", () => {
    const p = buildPrompt("hello there");
    expect(p).toContain("hello there");
    expect(p).toContain("JSON");
  });
});

describe("parseClaudeJson", () => {
  it("parses a clean JSON response", () => {
    const r = parseClaudeJson('{"summary":"s","tasks":["t1"],"tags":["a"]}');
    expect(r).toEqual({ summary: "s", tasks: ["t1"], tags: ["a"] });
  });

  it("strips markdown code fences", () => {
    const r = parseClaudeJson('```json\n{"summary":"ok","tasks":[],"tags":[]}\n```');
    expect(r.summary).toBe("ok");
  });

  it("lowercases tags and trims tasks", () => {
    const r = parseClaudeJson('{"summary":"s","tasks":["  do x  "],"tags":["RUST"]}');
    expect(r.tasks).toEqual(["do x"]);
    expect(r.tags).toEqual(["rust"]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseClaudeJson("not json")).toThrow();
  });

  it("throws when summary missing", () => {
    expect(() => parseClaudeJson('{"tasks":[]}')).toThrow();
  });
});

describe("organize", () => {
  it("runs whisper then claude and returns merged result", async () => {
    const whisper = async () => "산책 중 떠오른 아이디어: 새 탭 할 일 앱.";
    const claude = async () =>
      '{"summary":"새 탭 = 할 일 앱 아이디어","tasks":["사용자 인터뷰 3건"],"tags":["아이디어"]}';
    const out = await organize({ audio: null, whisper, claude });
    expect(out.transcript).toContain("산책");
    expect(out.summary).toContain("새 탭");
    expect(out.tasks).toEqual(["사용자 인터뷰 3건"]);
  });
});

describe("estimateCostUsd", () => {
  it("returns a positive cost", () => {
    const c = estimateCostUsd({ audioSeconds: 120, transcriptTokens: 500, summaryTokens: 200 });
    expect(c).toBeGreaterThan(0);
  });
});

describe("toMarkdown", () => {
  it("renders sections with checkbox tasks", () => {
    const md = toMarkdown({ summary: "s", tasks: ["a"], tags: ["x"], transcript: "t" }, { title: "T" });
    expect(md).toContain("# T");
    expect(md).toContain("- [ ] a");
    expect(md).toContain("#x");
  });
});
