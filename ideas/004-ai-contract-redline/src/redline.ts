import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const RiskLevel = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const ClauseRiskSchema = z.object({
  clause_text: z.string(),
  risk_level: RiskLevel,
  reason: z.string(),
  suggested_revision: z.string().nullable(),
});
export type ClauseRisk = z.infer<typeof ClauseRiskSchema>;

export const RedlineReportSchema = z.object({
  overall_risk: RiskLevel,
  summary: z.string(),
  clauses: z.array(ClauseRiskSchema),
});
export type RedlineReport = z.infer<typeof RedlineReportSchema>;

const SYSTEM = `당신은 한국 계약법 전문가입니다. 입력된 계약서 텍스트를 조항 단위로 분석해 위험도를 평가합니다.

특히 다음 패턴을 위험으로 판단:
- 일방적 해지권 (한쪽만 즉시 해지 가능)
- 무제한 손해배상 책임
- 책임 면제(면책) 조항이 한쪽에만 유리
- 지식재산권 일방 양도
- 비밀유지 의무가 한쪽에만 적용
- 분쟁 시 관할이 상대방 본사 도시로 일방 지정
- 위약금 조항이 통상 범위(계약금액의 10%)를 초과

응답은 다음 JSON:
{
  "overall_risk": "low"|"medium"|"high",
  "summary": "전반적 평가 2~3문장",
  "clauses": [
    {
      "clause_text": "원문 조항 일부 (50자 이내 발췌)",
      "risk_level": "low"|"medium"|"high",
      "reason": "왜 위험한지",
      "suggested_revision": "대안 문구 또는 null"
    }
  ]
}

JSON 외 출력 금지.`;

export function splitClauses(text: string): string[] {
  // "제 N 조" / "Section N." / "1." 등 일반적 조항 시작 기준으로 분할
  const pattern = /(?=\n?\s*(?:제\s*\d+\s*조|Section\s+\d+|Article\s+\d+|\d+\.\s))/g;
  return text
    .split(pattern)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export async function analyzeContract(
  contractText: string,
  client?: Anthropic
): Promise<RedlineReport> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: contractText.slice(0, 50000) }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  const parsed = JSON.parse(block.text);
  return RedlineReportSchema.parse(parsed);
}
