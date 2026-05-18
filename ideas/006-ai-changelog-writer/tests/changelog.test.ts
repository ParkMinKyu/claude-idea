import { describe, it, expect, vi } from "vitest";
import { filterNoise } from "../src/git";
import {
  generateChangelog,
  renderMarkdown,
  ChangelogSchema,
} from "../src/changelog";

describe("filterNoise", () => {
  it("removes chore/docs/style commits", () => {
    const out = filterNoise([
      { hash: "a", author: "x", subject: "chore: bump deps" },
      { hash: "b", author: "x", subject: "feat: add export to PDF" },
      { hash: "c", author: "x", subject: "docs: update README" },
      { hash: "d", author: "x", subject: "fix: crash on empty input" },
    ]);
    expect(out.map((c) => c.hash)).toEqual(["b", "d"]);
  });

  it("keeps Merge commits removed", () => {
    const out = filterNoise([
      { hash: "a", author: "x", subject: "Merge pull request #1" },
      { hash: "b", author: "x", subject: "feat: add login" },
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("renderMarkdown", () => {
  it("groups by category with version header", () => {
    const md = renderMarkdown(
      {
        entries: [
          {
            category: "feature",
            user_facing_description: "PDF 내보내기",
            related_commits: ["a"],
          },
          {
            category: "bugfix",
            user_facing_description: "로그인 실패 수정",
            related_commits: ["b"],
          },
        ],
      },
      "v1.2.0"
    );
    expect(md).toContain("# v1.2.0");
    expect(md).toContain("## 신규 기능");
    expect(md).toContain("- PDF 내보내기");
    expect(md).toContain("## 버그 수정");
  });
});

describe("generateChangelog", () => {
  it("returns empty when no commits", async () => {
    const result = await generateChangelog([]);
    expect(result.entries).toEqual([]);
  });

  it("parses Claude response", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                entries: [
                  {
                    category: "feature",
                    user_facing_description: "다크 모드 지원",
                    related_commits: ["abc12345"],
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const log = await generateChangelog(
      [{ hash: "abc12345", author: "x", subject: "feat: dark mode" }],
      fake
    );
    expect(log.entries[0].category).toBe("feature");
  });
});

describe("ChangelogSchema", () => {
  it("rejects unknown category", () => {
    expect(() =>
      ChangelogSchema.parse({
        entries: [
          {
            category: "wip",
            user_facing_description: "x",
            related_commits: [],
          },
        ],
      })
    ).toThrow();
  });
});
