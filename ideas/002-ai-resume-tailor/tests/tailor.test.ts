import { describe, it, expect, vi } from "vitest";
import {
  tailorResume,
  detectFabrication,
  TailorResultSchema,
} from "../src/tailor";

describe("detectFabrication", () => {
  it("flags keywords not present in original", () => {
    const orig = "React 개발자, TypeScript 3년 경력";
    const tailored = "React, TypeScript, Kubernetes, GraphQL 경험";
    const fab = detectFabrication(orig, tailored);
    expect(fab).toContain("Kubernetes");
    expect(fab).toContain("GraphQL");
    expect(fab).not.toContain("React");
  });

  it("returns empty when nothing new added", () => {
    const orig = "Python, FastAPI, Postgres";
    const tailored = "Python 개발자 — FastAPI와 Postgres 경험";
    expect(detectFabrication(orig, tailored)).toEqual([]);
  });
});

describe("tailorResume", () => {
  it("calls Anthropic and returns parsed result", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                tailored_resume: "# 이력서\nReact 5년",
                keywords_matched: ["React"],
                keywords_missing: ["Vue"],
                ats_score: 72,
                changes_explained: ["프론트엔드 경험 앞으로 배치"],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await tailorResume("React 5년 경력", "Vue 개발자 모집", fake);
    expect(result.ats_score).toBe(72);
    expect(result.keywords_matched).toEqual(["React"]);
  });
});

describe("TailorResultSchema", () => {
  it("rejects out-of-range ats_score", () => {
    expect(() =>
      TailorResultSchema.parse({
        tailored_resume: "x",
        keywords_matched: [],
        keywords_missing: [],
        ats_score: 150,
        changes_explained: [],
      })
    ).toThrow();
  });
});
