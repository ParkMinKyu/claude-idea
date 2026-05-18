import { describe, it, expect, vi } from "vitest";
import {
  reviewPR,
  extractChangedLines,
  ReviewResultSchema,
} from "../src/reviewer";

describe("extractChangedLines", () => {
  it("returns added line numbers in target file", () => {
    const patch = `@@ -10,3 +10,5 @@
 unchanged
+added1
+added2
 unchanged
+added3
 unchanged`;
    const lines = extractChangedLines(patch);
    expect(lines).toEqual([10, 11, 13]);
  });

  it("handles multiple hunks", () => {
    const patch = `@@ -1,2 +1,3 @@
 a
+x
 b
@@ -10,1 +11,2 @@
 c
+y`;
    const lines = extractChangedLines(patch);
    expect(lines).toEqual([2, 12]);
  });
});

describe("ReviewResultSchema", () => {
  it("rejects bad verdict", () => {
    expect(() =>
      ReviewResultSchema.parse({
        summary: "x",
        verdict: "merge",
        comments: [],
      })
    ).toThrow();
  });

  it("accepts valid review", () => {
    const ok = ReviewResultSchema.parse({
      summary: "괜찮습니다",
      verdict: "approve",
      comments: [
        { path: "a.ts", line: 5, severity: "nit", message: "변수명 개선" },
      ],
    });
    expect(ok.verdict).toBe("approve");
  });
});

describe("reviewPR", () => {
  it("calls Claude with diff and returns parsed review", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                summary: "Null 체크 누락",
                verdict: "request_changes",
                comments: [
                  {
                    path: "src/x.ts",
                    line: 12,
                    severity: "issue",
                    message: "null 가능성",
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await reviewPR(
      [{ path: "src/x.ts", patch: "@@ -1,1 +1,2 @@\n+const a = null" }],
      fake
    );
    expect(result.verdict).toBe("request_changes");
    expect(result.comments[0].severity).toBe("issue");
  });
});
