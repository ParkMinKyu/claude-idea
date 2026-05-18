import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const TailorResultSchema = z.object({
  tailored_resume: z.string(),
  keywords_matched: z.array(z.string()),
  keywords_missing: z.array(z.string()),
  ats_score: z.number().min(0).max(100),
  changes_explained: z.array(z.string()),
});

export type TailorResult = z.infer<typeof TailorResultSchema>;

const SYSTEM = `당신은 채용 컨설턴트입니다. 원본 이력서와 JD를 받아 맞춤형 이력서를 생성합니다.
규칙:
1. 원본에 없는 경험/스킬을 절대 추가하지 마세요 (왜곡 금지)
2. 표현은 JD의 키워드에 맞춰 재서술하되 사실은 유지
3. 강조할 경험을 앞쪽으로 재배치
4. JD에서 요구하는 핵심 키워드 중 원본에 있는 것은 모두 포함

응답은 반드시 다음 JSON 스키마를 따르세요:
{
  "tailored_resume": "맞춤 이력서 전문(Markdown)",
  "keywords_matched": ["원본에 있고 JD에도 있는 키워드"],
  "keywords_missing": ["JD에만 있는 키워드"],
  "ats_score": 0~100 정수,
  "changes_explained": ["주요 변경 사항 설명"]
}

JSON 외 다른 텍스트 출력 금지.`;

export async function tailorResume(
  resume: string,
  jobDescription: string,
  client?: Anthropic
): Promise<TailorResult> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const userMsg = `[원본 이력서]\n${resume}\n\n[채용 공고(JD)]\n${jobDescription}`;

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  const parsed = JSON.parse(block.text);
  return TailorResultSchema.parse(parsed);
}

// 가드: LLM이 원본에 없는 키워드/문장을 추가했는지 검증
export function detectFabrication(
  originalResume: string,
  tailored: string
): string[] {
  const origLower = originalResume.toLowerCase();
  const fabricated: string[] = [];
  // 흔한 위조 키워드 후보 (대문자/숫자 포함 단어)
  const tokens = tailored.match(/\b[A-Z][A-Za-z0-9+#.]{2,}\b/g) ?? [];
  for (const t of new Set(tokens)) {
    if (!origLower.includes(t.toLowerCase())) {
      fabricated.push(t);
    }
  }
  return fabricated;
}
