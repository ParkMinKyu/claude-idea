import { parseDDL, toDot } from "../ideas/110-db-schema-visualizer/src/parser.js";

const SAMPLE_DDL = `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

window.__DEMO_SPEC__ = {
  description:
    "SQL DDL(CREATE TABLE)을 붙여넣으면 컬럼/PK/FK를 파싱하여 ERD용 Graphviz DOT과 그래프 모델(JSON)로 변환합니다.",
  fields: [
    { name: "ddl", type: "textarea", label: "SQL DDL", rows: 16, default: SAMPLE_DDL },
  ],
  run(v) {
    let model;
    try {
      model = parseDDL(v.ddl || "");
    } catch (e) {
      return [{ label: "파싱 오류", type: "error", value: e.message }];
    }
    if (!model.tables.length) {
      return [
        { label: "결과 없음", type: "warn", value: "CREATE TABLE 구문을 찾지 못했습니다." },
      ];
    }
    return [
      {
        label: "요약",
        type: "badge",
        value: `테이블 ${model.tables.length} · 관계 ${model.relations.length}`,
        tone: "neutral",
      },
      { label: "Graphviz DOT", type: "code", value: toDot(model) },
      { label: "그래프 모델", type: "json", value: model },
    ];
  },
};
