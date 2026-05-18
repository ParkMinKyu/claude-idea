import { describe, it, expect, vi } from "vitest";
import {
  isReadOnly,
  generateSQL,
  SqlPlanSchema,
} from "../src/nl2sql";

describe("isReadOnly", () => {
  it("permits SELECT", () => {
    expect(isReadOnly("SELECT * FROM sales")).toBe(true);
    expect(isReadOnly("WITH a AS (SELECT 1) SELECT * FROM a")).toBe(true);
  });

  it("rejects write operations", () => {
    expect(isReadOnly("DROP TABLE sales")).toBe(false);
    expect(isReadOnly("DELETE FROM sales WHERE 1=1")).toBe(false);
    expect(isReadOnly("update sales set x=1")).toBe(false);
    expect(isReadOnly("INSERT INTO x VALUES (1)")).toBe(false);
  });
});

describe("SqlPlanSchema", () => {
  it("rejects bad chart type", () => {
    expect(() =>
      SqlPlanSchema.parse({
        sql: "SELECT 1",
        explanation: "x",
        chart: { type: "scatter", x: null, y: null },
      })
    ).toThrow();
  });
});

describe("generateSQL", () => {
  it("returns parsed plan when SQL is safe", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                sql: "SELECT product, SUM(amount) AS total FROM sales GROUP BY product ORDER BY total DESC LIMIT 10",
                explanation: "제품별 총 매출 상위 10",
                chart: { type: "bar", x: "product", y: "total" },
              }),
            },
          ],
        }),
      },
    } as any;
    const plan = await generateSQL(
      "상위 10개 제품 매출",
      {
        table_name: "sales",
        columns: [
          { name: "product", type: "VARCHAR" },
          { name: "amount", type: "DOUBLE" },
        ],
        sample_rows: [{ product: "A", amount: 100 }],
      },
      fake
    );
    expect(plan.chart.type).toBe("bar");
    expect(plan.sql).toContain("SELECT");
  });

  it("throws if Claude returns write SQL", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                sql: "DROP TABLE sales",
                explanation: "x",
                chart: { type: "table", x: null, y: null },
              }),
            },
          ],
        }),
      },
    } as any;
    await expect(
      generateSQL(
        "삭제",
        {
          table_name: "sales",
          columns: [{ name: "a", type: "INT" }],
          sample_rows: [],
        },
        fake
      )
    ).rejects.toThrow(/forbidden/);
  });
});
