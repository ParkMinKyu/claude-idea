import { generate } from "../ideas/130-mock-data-gen/src/schema.js";

const DEFAULT_SCHEMA = JSON.stringify(
  {
    id: "uuid",
    name: "name",
    email: "email",
    age: { type: "int", min: 18, max: 65 },
    role: { type: "enum", values: ["admin", "editor", "viewer"] },
    active: "bool",
    joinedAt: { type: "date", start: "2022-01-01", end: "2025-12-31" },
    tags: { type: "array", of: "string", count: 3 },
  },
  null,
  2
);

window.__DEMO_SPEC__ = {
  description:
    "스키마 JSON과 시드(seed)로부터 결정적(deterministic) 목 데이터 레코드를 생성합니다. 같은 시드는 항상 같은 결과를 만듭니다.",
  fields: [
    { name: "schema", type: "textarea", label: "스키마 (JSON)", rows: 12, default: DEFAULT_SCHEMA },
    { name: "count", type: "number", label: "생성 개수", default: 5 },
    { name: "seed", type: "number", label: "시드", default: 42 },
  ],
  run(v) {
    let schema;
    try {
      schema = JSON.parse(v.schema);
    } catch (e) {
      return [{ label: "오류", type: "error", value: "스키마 JSON 파싱 실패: " + e.message }];
    }
    const count = Math.max(1, Math.min(100, Number(v.count) || 5));
    const seed = Number(v.seed) || 1;
    let rows;
    try {
      rows = generate(schema, { count, seed });
    } catch (e) {
      return [{ label: "오류", type: "error", value: "생성 실패: " + e.message }];
    }
    return [
      { label: "생성 개수", type: "badge", value: `${rows.length}건 (seed=${seed})`, tone: "good" },
      { label: "생성된 목 데이터", type: "json", value: rows },
    ];
  },
};
