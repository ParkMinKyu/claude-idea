import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const QuestionSchema = z.object({
  question: z.string(),
  category: z.enum(["behavioral", "technical", "culture_fit", "case"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionListSchema = z.object({
  questions: z.array(QuestionSchema),
});

export const FeedbackSchema = z.object({
  star_score: z.object({
    situation: z.number().int().min(0).max(10),
    task: z.number().int().min(0).max(10),
    action: z.number().int().min(0).max(10),
    result: z.number().int().min(0).max(10),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  ideal_answer: z.string(),
  overall_score: z.number().int().min(0).max(100),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

const QUESTION_SYSTEM = `당신은 채용 면접관입니다. 회사명과 직무 설명을 받아 실전 면접 질문 10개를 생성합니다.
- 행동/기술/컬쳐핏/케이스 카테고리 균형 배분
- 해당 회사의 알려진 면접 스타일 반영
- 난이도 mix (easy 3, medium 5, hard 2)

응답 JSON: {"questions":[{"question":"...","category":"behavioral","difficulty":"easy"}]}
JSON 외 출력 금지.`;

export async function generateQuestions(
  company: string,
  jobDescription: string,
  client?: Anthropic
): Promise<Question[]> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: QUESTION_SYSTEM,
    messages: [
      { role: "user", content: `회사: ${company}\n직무: ${jobDescription}` },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return QuestionListSchema.parse(JSON.parse(block.text)).questions;
}

const FEEDBACK_SYSTEM = `당신은 면접 코치입니다. 면접 질문과 사용자 답변을 받아 STAR(Situation/Task/Action/Result) 기준으로 평가합니다.

응답 JSON:
{
  "star_score": {"situation":0~10,"task":0~10,"action":0~10,"result":0~10},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "ideal_answer": "사용자 답변을 개선한 모범 답안 (한국어, 5~7문장)",
  "overall_score": 0~100
}

JSON 외 출력 금지.`;

export async function analyzeAnswer(
  question: string,
  answer: string,
  client?: Anthropic
): Promise<Feedback> {
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: FEEDBACK_SYSTEM,
    messages: [
      {
        role: "user",
        content: `[질문]\n${question}\n\n[답변]\n${answer}`,
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return FeedbackSchema.parse(JSON.parse(block.text));
}
