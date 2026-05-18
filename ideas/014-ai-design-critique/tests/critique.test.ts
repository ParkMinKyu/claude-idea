import { describe, it, expect, vi } from "vitest";
import {
  critiqueDesign,
  sortBySeverity,
  CritiqueSchema,
  IssueSchema,
} from "../src/critique";

describe("IssueSchema", () => {
  it("requires all fields", () => {
    expect(() =>
      IssueSchema.parse({
        heuristic: "x",
        description: "x",
        severity: "P0",
      })
    ).toThrow();
  });
});

describe("CritiqueSchema", () => {
  it("rejects out-of-range score", () => {
    expect(() =>
      CritiqueSchema.parse({
        platform: "mobile",
        overall_score: -1,
        summary: "x",
        issues: [],
      })
    ).toThrow();
  });
});

describe("sortBySeverity", () => {
  it("orders P0 < P1 < P2", () => {
    const sorted = sortBySeverity([
      {
        heuristic: "h",
        description: "d",
        severity: "P2",
        suggestion: "s",
        location_hint: "l",
      },
      {
        heuristic: "h",
        description: "d",
        severity: "P0",
        suggestion: "s",
        location_hint: "l",
      },
      {
        heuristic: "h",
        description: "d",
        severity: "P1",
        suggestion: "s",
        location_hint: "l",
      },
    ]);
    expect(sorted.map((i) => i.severity)).toEqual(["P0", "P1", "P2"]);
  });
});

describe("critiqueDesign", () => {
  it("calls Claude vision with image", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                platform: "mobile",
                overall_score: 65,
                summary: "기본은 잘 갖춰졌으나 접근성 이슈 다수",
                issues: [
                  {
                    heuristic: "WCAG 색 대비",
                    description: "회색 텍스트 대비 부족",
                    severity: "P0",
                    suggestion: "대비 4.5:1 이상으로 조정",
                    location_hint: "본문 텍스트",
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await critiqueDesign("ZmFrZQ==", "image/png", fake);
    expect(result.platform).toBe("mobile");
    expect(result.issues[0].severity).toBe("P0");

    const call = fake.messages.create.mock.calls[0][0];
    expect(call.messages[0].content[0].type).toBe("image");
  });
});
