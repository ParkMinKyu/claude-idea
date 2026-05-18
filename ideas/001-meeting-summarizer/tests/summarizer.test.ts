import { describe, it, expect, vi } from "vitest";
import { MeetingSummarySchema, toMarkdown, summarizeMeeting } from "../src/summarizer";

describe("MeetingSummarySchema", () => {
  it("validates well-formed summary", () => {
    const ok = MeetingSummarySchema.parse({
      summary: "팀이 Q3 로드맵을 확정함.",
      decisions: ["결제 모듈 우선 출시"],
      action_items: [
        { task: "API 설계", owner: "지수", due: "2026-06-01" },
        { task: "QA 일정 조율", owner: null, due: null },
      ],
    });
    expect(ok.action_items).toHaveLength(2);
  });

  it("rejects malformed summary", () => {
    expect(() =>
      MeetingSummarySchema.parse({ summary: 123, decisions: [], action_items: [] })
    ).toThrow();
  });
});

describe("toMarkdown", () => {
  it("renders markdown with checkboxes", () => {
    const md = toMarkdown({
      summary: "회의 요약 내용",
      decisions: ["A 결정", "B 결정"],
      action_items: [{ task: "문서 작성", owner: "민수", due: "내일" }],
    });
    expect(md).toContain("# 회의 요약");
    expect(md).toContain("- A 결정");
    expect(md).toContain("- [ ] 문서 작성 (담당: 민수, 기한: 내일)");
  });
});

describe("summarizeMeeting", () => {
  it("calls Anthropic and parses JSON response", async () => {
    const fakeClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                summary: "요약",
                decisions: ["결정1"],
                action_items: [{ task: "할일", owner: "철수", due: null }],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await summarizeMeeting("아주 긴 회의록 텍스트 ".repeat(5), fakeClient);
    expect(result.summary).toBe("요약");
    expect(fakeClient.messages.create).toHaveBeenCalledOnce();
  });
});
