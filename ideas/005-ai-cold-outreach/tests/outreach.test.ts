import { describe, it, expect, vi } from "vitest";
import {
  generateOutreach,
  OutreachResultSchema,
  SenderProfileSchema,
} from "../src/outreach";

const sender = {
  name: "김지수",
  company: "Acme",
  role: "Founder",
  product: "AI 회의록 도구",
  value_prop: "회의 정리 시간 80% 단축",
  desired_action: "15분 데모 미팅",
};

const recipient = {
  name: "박민호",
  linkedin_text: "삼성전자 SW 엔지니어 7년, 최근 시리즈 A 스타트업 CTO로 이직.",
};

describe("OutreachResultSchema", () => {
  it("requires exactly 3 variants", () => {
    expect(() =>
      OutreachResultSchema.parse({
        hook: "h",
        variants: [{ tone: "friendly", subject: "s", body: "b" }],
      })
    ).toThrow();
  });

  it("accepts well-formed result", () => {
    const ok = OutreachResultSchema.parse({
      hook: "최근 CTO 이직",
      variants: [
        { tone: "friendly", subject: "축하드려요", body: "..." },
        { tone: "professional", subject: "제안 드립니다", body: "..." },
        { tone: "humorous", subject: "CTO의 첫 회의는", body: "..." },
      ],
    });
    expect(ok.variants).toHaveLength(3);
  });
});

describe("SenderProfileSchema", () => {
  it("requires all fields", () => {
    expect(() => SenderProfileSchema.parse({ name: "x" })).toThrow();
  });
});

describe("generateOutreach", () => {
  it("calls Claude and validates response", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                hook: "CTO 이직",
                variants: [
                  { tone: "friendly", subject: "환영합니다", body: "박민호님, ..." },
                  { tone: "professional", subject: "제안", body: "안녕하세요, ..." },
                  { tone: "humorous", subject: "CTO 살아남기", body: "민호님, ..." },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await generateOutreach(sender, recipient, fake);
    expect(result.variants[0].tone).toBe("friendly");
    expect(fake.messages.create).toHaveBeenCalledOnce();
  });
});
