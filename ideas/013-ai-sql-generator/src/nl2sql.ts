import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
});
export type Column = z.infer<typeof ColumnSchema>;

export const TableSchemaSchema = z.object({
  table_name: z.string(),
  columns: z.array(ColumnSchema),
  sample_rows: z.array(z.record(z.unknown())).max(5),
});
export type TableSchema = z.infer<typeof TableSchemaSchema>;

export const ChartSpecSchema = z.object({
  type: z.enum(["bar", "line", "pie", "table"]),
  x: z.string().nullable(),
  y: z.string().nullable(),
});
export type ChartSpec = z.infer<typeof ChartSpecSchema>;

export const SqlPlanSchema = z.object({
  sql: z.string(),
  explanation: z.string(),
  chart: ChartSpecSchema,
});
export type SqlPlan = z.infer<typeof SqlPlanSchema>;

const SYSTEM = `당신은 데이터 분석가입니다. 주어진 테이블 스키마와 한국어 질문을 받아 DuckDB 호환 SQL을 생성하고, 결과 시각화 형식을 추천하세요.

규칙:
- read-only: SELECT, WITH, VALUES만 사용. INSERT/UPDATE/DELETE/DROP/ALTER 금지.
- 테이블/컬럼 이름은 스키마에 있는 것만 사용
- 한국어 컬럼명도 그대로 사용 가능 (큰따옴표로 감쌀 것)
- 결과 행이 많을 수 있으면 LIMIT 1000

응답 JSON:
{
  "sql": "SELECT ...",
  "explanation": "이 쿼리가 무엇을 하는지 한국어 1~2문장",
  "chart": {"type":"bar"|"line"|"pie"|"table","x":"컬럼명 또는 null","y":"컬럼명 또는 null"}
}

JSON 외 출력 금지.`;

// 위험 SQL 키워드 사전 차단
const FORBIDDEN = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|ATTACH|COPY|EXPORT)\b/i;

export function isReadOnly(sql: string): boolean {
  return !FORBIDDEN.test(sql);
}

export async function generateSQL(
  question: string,
  schema: TableSchema,
  client?: Anthropic
): Promise<SqlPlan> {
  TableSchemaSchema.parse(schema);
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const userMsg = `[스키마]\n테이블: ${schema.table_name}\n컬럼: ${schema.columns
    .map((c) => `${c.name}(${c.type})`)
    .join(", ")}\n샘플 행: ${JSON.stringify(schema.sample_rows)}\n\n[질문]\n${question}`;

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  const plan = SqlPlanSchema.parse(JSON.parse(block.text));

  if (!isReadOnly(plan.sql)) {
    throw new Error("Generated SQL contains forbidden write operation");
  }
  return plan;
}
