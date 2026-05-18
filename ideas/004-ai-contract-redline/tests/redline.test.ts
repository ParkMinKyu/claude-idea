import { describe, it, expect, vi } from "vitest";
import {
  splitClauses,
  analyzeContract,
  RedlineReportSchema,
} from "../src/redline";

describe("splitClauses", () => {
  it("splits by 제N조 pattern", () => {
    const txt = `
제 1 조 (목적) 본 계약은 ...
제 2 조 (정의) 본 계약에서 사용하는 용어는 ...
제 3 조 (계약기간) 계약 기간은 1년이다.
`;
    const clauses = splitClauses(txt);
    expect(clauses.length).toBe(3);
    expect(clauses[0]).toContain("목적");
  });

  it("filters out tiny fragments", () => {
    const out = splitClauses("a\n1. b\n2. xxxxxxxxxxxxxxxxxxxxxxxx");
    expect(out.length).toBe(1);
  });
});

describe("analyzeContract", () => {
  it("parses Claude JSON into typed report", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                overall_risk: "high",
                summary: "위험 조항 다수 발견",
                clauses: [
                  {
                    clause_text: "갑은 언제든 해지 가능",
                    risk_level: "high",
                    reason: "일방적 해지권",
                    suggested_revision: "양 당사자 30일 사전 통지",
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const report = await analyzeContract("샘플 계약서 텍스트", fake);
    expect(report.overall_risk).toBe("high");
    expect(report.clauses[0].risk_level).toBe("high");
  });
});

describe("RedlineReportSchema", () => {
  it("rejects invalid risk_level", () => {
    expect(() =>
      RedlineReportSchema.parse({
        overall_risk: "extreme",
        summary: "x",
        clauses: [],
      })
    ).toThrow();
  });
});
