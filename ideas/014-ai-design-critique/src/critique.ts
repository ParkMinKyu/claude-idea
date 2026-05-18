import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const IssueSchema = z.object({
  heuristic: z.string().describe("닐슨 휴리스틱 또는 WCAG 항목"),
  description: z.string(),
  severity: z.enum(["P0", "P1", "P2"]),
  suggestion: z.string(),
  location_hint: z.string().describe("스크린샷 내 위치 설명"),
});
export type Issue = z.infer<typeof IssueSchema>;

export const CritiqueSchema = z.object({
  platform: z.enum(["mobile", "web", "tablet", "unknown"]),
  overall_score: z.number().int().min(0).max(100),
  summary: z.string(),
  issues: z.array(IssueSchema),
});
export type Critique = z.infer<typeof CritiqueSchema>;

const SYSTEM = `당신은 시니어 UX 디자이너입니다. 입력된 UI 스크린샷을 다음 기준으로 평가하세요:

[닐슨 10대 휴리스틱]
1. 시스템 상태 가시성  2. 시스템과 현실 매칭  3. 사용자 통제와 자유
4. 일관성과 표준  5. 에러 예방  6. 인식 vs 회상  7. 유연성과 효율성
8. 미적 미니멀  9. 에러 회복  10. 도움말과 문서

[WCAG 핵심] 색 대비 4.5:1, 터치 타겟 44px, 라벨 명확성

규칙:
- 실제 문제만 지적 (취향 X)
- 심각도 P0(차단)/P1(중요)/P2(개선) 부여
- 각 이슈에 구체적 개선안 포함
- 한국어로 출력

응답 JSON:
{
  "platform": "mobile"|"web"|"tablet"|"unknown",
  "overall_score": 0~100,
  "summary": "전체 평가 2~3문장",
  "issues": [
    {
      "heuristic": "예: 일관성과 표준",
      "description": "문제 설명",
      "severity": "P0"|"P1"|"P2",
      "suggestion": "개선안",
      "location_hint": "예: 상단 헤더 우측 버튼"
    }
  ]
}

JSON 외 출력 금지.`;

export async function critiqueDesign(
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp",
  client?: Anthropic
): Promise<Critique> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 3072,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType,
              data: imageBase64,
            },
          },
          { type: "text", text: "이 UI를 평가해주세요." },
        ],
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return CritiqueSchema.parse(JSON.parse(block.text));
}

export function sortBySeverity(issues: Issue[]): Issue[] {
  const order: Record<Issue["severity"], number> = { P0: 0, P1: 1, P2: 2 };
  return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
}
