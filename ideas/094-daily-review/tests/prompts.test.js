import { describe, it, expect } from "vitest";
import {
  buildContext,
  buildPromptRequest,
  parsePromptResponse,
  detectMood,
  shouldSendNow,
} from "../src/prompts.js";

describe("buildContext", () => {
  it("returns top tags and avg mood", () => {
    const entries = [
      { tags: ["work", "code"], mood: 3 },
      { tags: ["work"], mood: 4 },
      { tags: ["family"], mood: 5 },
    ];
    const ctx = buildContext(entries);
    expect(ctx.topTags[0]).toBe("work");
    expect(ctx.avgMood).toBe(4);
    expect(ctx.recentCount).toBe(3);
  });

  it("handles entries without mood", () => {
    const ctx = buildContext([{ tags: ["a"] }]);
    expect(ctx.avgMood).toBeNull();
  });
});

describe("buildPromptRequest", () => {
  it("includes recent context and last excerpt", () => {
    const entries = [{ tags: ["health"], mood: 3, text: "운동을 했다" }];
    const req = buildPromptRequest({ name: "Ada" }, entries, new Date("2026-05-18"));
    expect(req.system).toContain("Korean");
    const user = JSON.parse(req.user);
    expect(user.topTags).toContain("health");
    expect(user.lastEntryExcerpt).toBe("운동을 했다");
    expect(user.date).toBe("2026-05-18");
  });
});

describe("parsePromptResponse", () => {
  it("parses a JSON array", () => {
    const out = parsePromptResponse('["a","b","c"]');
    expect(out).toEqual(["a", "b", "c"]);
  });
  it("strips code fences", () => {
    const out = parsePromptResponse('```json\n["x","y"]\n```');
    expect(out).toEqual(["x", "y"]);
  });
  it("caps at 3 items", () => {
    const out = parsePromptResponse('["a","b","c","d"]');
    expect(out).toHaveLength(3);
  });
});

describe("detectMood", () => {
  it("detects positive", () => {
    const m = detectMood("오늘 정말 감사하고 기쁨이 가득했다");
    expect(m.label).toBe("positive");
  });
  it("detects negative", () => {
    const m = detectMood("불안하고 지쳐서 슬펐다");
    expect(m.label).toBe("negative");
  });
  it("returns neutral when no signal", () => {
    const m = detectMood("그냥 평범한 하루였다");
    expect(m.label).toBe("neutral");
  });
});

describe("shouldSendNow", () => {
  it("inside default window", () => {
    expect(shouldSendNow(19, {})).toBe(true);
  });
  it("outside window", () => {
    expect(shouldSendNow(10, {})).toBe(false);
  });
});
