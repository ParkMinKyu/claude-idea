import { describe, it, expect, vi } from "vitest";
import {
  generateQuestions,
  analyzeAnswer,
  FeedbackSchema,
  QuestionSchema,
} from "../src/coach";

describe("QuestionSchema", () => {
  it("accepts valid question", () => {
    QuestionSchema.parse({
      question: "팀에서 갈등을 해결한 경험을 말해주세요",
      category: "behavioral",
      difficulty: "medium",
    });
  });

  it("rejects unknown category", () => {
    expect(() =>
      QuestionSchema.parse({
        question: "x",
        category: "puzzle",
        difficulty: "easy",
      })
    ).toThrow();
  });
});

describe("FeedbackSchema", () => {
  it("rejects out-of-range overall score", () => {
    expect(() =>
      FeedbackSchema.parse({
        star_score: { situation: 5, task: 5, action: 5, result: 5 },
        strengths: [],
        weaknesses: [],
        ideal_answer: "x",
        overall_score: 150,
      })
    ).toThrow();
  });
});

describe("generateQuestions", () => {
  it("parses Claude response into questions", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                questions: [
                  {
                    question: "협업 갈등 경험은?",
                    category: "behavioral",
                    difficulty: "medium",
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const qs = await generateQuestions("네이버", "백엔드 개발자", fake);
    expect(qs[0].category).toBe("behavioral");
  });
});

describe("analyzeAnswer", () => {
  it("returns valid feedback", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                star_score: { situation: 7, task: 6, action: 8, result: 5 },
                strengths: ["구체적 상황 설명"],
                weaknesses: ["결과 수치 부족"],
                ideal_answer: "...",
                overall_score: 68,
              }),
            },
          ],
        }),
      },
    } as any;
    const fb = await analyzeAnswer("Q?", "A...", fake);
    expect(fb.overall_score).toBe(68);
    expect(fb.star_score.action).toBe(8);
  });
});
