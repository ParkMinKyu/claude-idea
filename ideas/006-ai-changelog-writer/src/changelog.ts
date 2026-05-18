import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { Commit } from "./git.js";

export const ChangelogEntrySchema = z.object({
  category: z.enum(["feature", "improvement", "bugfix"]),
  user_facing_description: z.string(),
  related_commits: z.array(z.string()),
});
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

export const ChangelogSchema = z.object({
  entries: z.array(ChangelogEntrySchema),
});
export type Changelog = z.infer<typeof ChangelogSchema>;

const SYSTEM = `당신은 릴리스 노트 작성 전문가입니다.
주어진 git 커밋 목록을 사용자 관점에서 분류·재서술하세요.

규칙:
- 개발자 용어(refactor, lint, deps)는 절대 사용 금지
- 사용자에게 가치 없는 항목은 제외
- 카테고리: feature(신규)/improvement(개선)/bugfix(버그수정)
- 여러 커밋이 같은 기능이면 하나의 항목으로 묶기

응답 JSON:
{
  "entries": [
    {
      "category": "feature"|"improvement"|"bugfix",
      "user_facing_description": "사용자가 이해할 문장",
      "related_commits": ["hash1", "hash2"]
    }
  ]
}

JSON 외 출력 금지.`;

export async function generateChangelog(
  commits: Commit[],
  client?: Anthropic
): Promise<Changelog> {
  if (commits.length === 0) return { entries: [] };

  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const commitList = commits
    .map((c) => `${c.hash.slice(0, 8)} ${c.subject}`)
    .join("\n");

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3072,
    system: SYSTEM,
    messages: [{ role: "user", content: commitList }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return ChangelogSchema.parse(JSON.parse(block.text));
}

export function renderMarkdown(log: Changelog, version: string): string {
  const groups = {
    feature: log.entries.filter((e) => e.category === "feature"),
    improvement: log.entries.filter((e) => e.category === "improvement"),
    bugfix: log.entries.filter((e) => e.category === "bugfix"),
  };

  const lines = [`# ${version}\n`];
  if (groups.feature.length) {
    lines.push("## 신규 기능");
    for (const e of groups.feature) lines.push(`- ${e.user_facing_description}`);
    lines.push("");
  }
  if (groups.improvement.length) {
    lines.push("## 개선");
    for (const e of groups.improvement) lines.push(`- ${e.user_facing_description}`);
    lines.push("");
  }
  if (groups.bugfix.length) {
    lines.push("## 버그 수정");
    for (const e of groups.bugfix) lines.push(`- ${e.user_facing_description}`);
    lines.push("");
  }
  return lines.join("\n");
}
