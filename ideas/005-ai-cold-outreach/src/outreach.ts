import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const SenderProfileSchema = z.object({
  name: z.string(),
  company: z.string(),
  role: z.string(),
  product: z.string(),
  value_prop: z.string(),
  desired_action: z.string(),
});
export type SenderProfile = z.infer<typeof SenderProfileSchema>;

export const RecipientSchema = z.object({
  name: z.string(),
  linkedin_text: z.string(),
});
export type Recipient = z.infer<typeof RecipientSchema>;

export const OutreachVariantSchema = z.object({
  tone: z.enum(["friendly", "professional", "humorous"]),
  subject: z.string(),
  body: z.string(),
});
export type OutreachVariant = z.infer<typeof OutreachVariantSchema>;

export const OutreachResultSchema = z.object({
  hook: z.string().describe("개인화에 사용한 hook"),
  variants: z.array(OutreachVariantSchema).length(3),
});
export type OutreachResult = z.infer<typeof OutreachResultSchema>;

const SYSTEM = `당신은 B2B 콜드메일 전문가입니다.
주어진 수신자 LinkedIn 프로필과 발신자 정보를 바탕으로,
수신자의 경력/관심사에서 진정성 있는 hook을 발굴해 3가지 톤의 메일을 생성합니다.

규칙:
- 첫 줄은 반드시 수신자 개인화 (회사명/공통 출신/최근 활동 등)
- 영업 색채를 줄이고 가치 제안 중심
- 한국어, 200자 이내 본문
- 마지막 줄에 명확한 CTA

응답 JSON 스키마:
{
  "hook": "사용한 개인화 포인트",
  "variants": [
    {"tone": "friendly", "subject": "...", "body": "..."},
    {"tone": "professional", "subject": "...", "body": "..."},
    {"tone": "humorous", "subject": "...", "body": "..."}
  ]
}

JSON 외 출력 금지.`;

export async function generateOutreach(
  sender: SenderProfile,
  recipient: Recipient,
  client?: Anthropic
): Promise<OutreachResult> {
  SenderProfileSchema.parse(sender);
  RecipientSchema.parse(recipient);

  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const userMsg = `[발신자]\n이름: ${sender.name}\n회사: ${sender.company}\n역할: ${sender.role}\n제품: ${sender.product}\n가치 제안: ${sender.value_prop}\n원하는 액션: ${sender.desired_action}\n\n[수신자: ${recipient.name}]\n${recipient.linkedin_text}`;

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  const parsed = JSON.parse(block.text);
  return OutreachResultSchema.parse(parsed);
}
