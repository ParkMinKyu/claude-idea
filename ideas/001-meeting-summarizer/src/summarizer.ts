import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const MeetingSummarySchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  action_items: z.array(
    z.object({
      task: z.string(),
      owner: z.string().nullable(),
      due: z.string().nullable(),
    })
  ),
});

export type MeetingSummary = z.infer<typeof MeetingSummarySchema>;

const SYSTEM_PROMPT = `당신은 회의록 분석 전문가입니다.
입력된 회의 녹취록 또는 메모를 읽고 다음을 JSON으로 출력하세요:
- summary: 3~5문장 핵심 요약
- decisions: 결정 사항 목록
- action_items: 액션 아이템 (task, owner, due 포함; 미상이면 null)

반드시 유효한 JSON만 응답하세요. 마크다운 코드블록 사용 금지.`;

export async function summarizeMeeting(
  transcript: string,
  client?: Anthropic
): Promise<MeetingSummary> {
  const anthropic =
    client ??
    new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key",
    });

  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: transcript }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = JSON.parse(textBlock.text);
  return MeetingSummarySchema.parse(parsed);
}

export function toMarkdown(s: MeetingSummary): string {
  const lines: string[] = [];
  lines.push("# 회의 요약\n");
  lines.push(s.summary + "\n");
  lines.push("## 결정 사항");
  for (const d of s.decisions) lines.push(`- ${d}`);
  lines.push("\n## 액션 아이템");
  for (const a of s.action_items) {
    const owner = a.owner ?? "미정";
    const due = a.due ?? "미정";
    lines.push(`- [ ] ${a.task} (담당: ${owner}, 기한: ${due})`);
  }
  return lines.join("\n");
}
