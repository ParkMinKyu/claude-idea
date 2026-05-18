import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const LevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1"]);
export type Level = z.infer<typeof LevelSchema>;

export const CorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
});
export type Correction = z.infer<typeof CorrectionSchema>;

export const TutorResponseSchema = z.object({
  reply: z.string().describe("대화 답변 (목표 언어)"),
  corrections: z.array(CorrectionSchema),
  new_vocabulary: z.array(
    z.object({
      word: z.string(),
      meaning: z.string(),
      example: z.string(),
    })
  ),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

function buildSystem(targetLanguage: string, level: Level): string {
  return `당신은 ${targetLanguage} 회화 튜터입니다. 사용자의 레벨은 ${level}.
규칙:
1. 답변은 항상 ${targetLanguage}로, 사용자 레벨에 맞춘 어휘/속도
2. 사용자 발화에 문법/표현 오류가 있으면 corrections에 기록 (없으면 빈 배열)
3. 사용자에게 새로운 어휘 1~3개를 new_vocabulary로 제안 (한국어 의미 + 예문)
4. 답변은 자연스러운 대화체, 1~3문장
5. 응답 형식은 반드시 JSON:
{
  "reply": "...",
  "corrections": [{"original":"...","corrected":"...","explanation":"한국어 설명"}],
  "new_vocabulary": [{"word":"...","meaning":"한국어 의미","example":"예문"}]
}

JSON 외 출력 금지.`;
}

export async function chat(
  history: ChatMessage[],
  userInput: string,
  targetLanguage: string = "English",
  level: Level = "B1",
  client?: Anthropic
): Promise<TutorResponse> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userInput },
  ];

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: buildSystem(targetLanguage, level),
    messages,
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return TutorResponseSchema.parse(JSON.parse(block.text));
}

// 단순 휴리스틱 레벨 추정
export function estimateLevel(samples: string[]): Level {
  const text = samples.join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const uniqueRatio =
    new Set(text.toLowerCase().split(/\s+/)).size / Math.max(wordCount, 1);
  if (wordCount < 20) return "A1";
  if (uniqueRatio < 0.4) return "A2";
  if (uniqueRatio < 0.55) return "B1";
  if (uniqueRatio < 0.7) return "B2";
  return "C1";
}
