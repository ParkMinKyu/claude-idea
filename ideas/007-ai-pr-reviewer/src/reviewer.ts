import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const InlineCommentSchema = z.object({
  path: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(["nit", "suggestion", "issue", "blocker"]),
  message: z.string(),
});
export type InlineComment = z.infer<typeof InlineCommentSchema>;

export const ReviewResultSchema = z.object({
  summary: z.string(),
  verdict: z.enum(["approve", "comment", "request_changes"]),
  comments: z.array(InlineCommentSchema),
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

const SYSTEM = `당신은 시니어 코드 리뷰어입니다. PR diff를 받아 다음을 수행:
1) 명백한 버그/보안 이슈/누락된 에러 처리/누락된 테스트 식별
2) 인라인 코멘트로 라인 단위 지적
3) 전체 verdict 결정 (approve/comment/request_changes)

규칙:
- nit/style은 적게 (가치 없는 잔소리 금지)
- blocker는 보안/명백한 버그에만
- 코멘트는 한국어, 1~2문장
- diff에 없는 줄 번호는 사용 금지

응답 JSON:
{
  "summary": "전반 평가 2~3문장",
  "verdict": "approve" | "comment" | "request_changes",
  "comments": [
    {"path": "src/x.ts", "line": 42, "severity": "issue", "message": "..."}
  ]
}

JSON 외 출력 금지.`;

export interface DiffFile {
  path: string;
  patch: string; // unified diff
}

export async function reviewPR(
  files: DiffFile[],
  client?: Anthropic
): Promise<ReviewResult> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const diffText = files
    .map((f) => `=== ${f.path} ===\n${f.patch}`)
    .join("\n\n");

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: diffText.slice(0, 80000) }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return ReviewResultSchema.parse(JSON.parse(block.text));
}

// diff hunk에서 라인 번호 → 파일 라인 매핑 (간단 버전)
export function extractChangedLines(patch: string): number[] {
  const lines: number[] = [];
  let currentLine = 0;
  for (const line of patch.split("\n")) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      currentLine = parseInt(hunk[1], 10);
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push(currentLine);
      currentLine++;
    } else if (!line.startsWith("-")) {
      currentLine++;
    }
  }
  return lines;
}
