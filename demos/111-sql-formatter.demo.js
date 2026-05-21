import { format, lint } from "../ideas/111-sql-formatter/src/lib/formatter.ts";

const SAMPLE = `select id, name, email from users u left join orders o on o.user_id = u.id where u.active = 1 and o.total > 100 order by o.total desc limit 10;`;

window.__DEMO_SPEC__ = {
  description:
    "지저분한 SQL을 토크나이저 기반 포매터로 절(clause)별 줄바꿈/들여쓰기 정리하고, 위험 패턴(SELECT *, WHERE 없는 DELETE 등)을 린트합니다.",
  fields: [
    { name: "sql", type: "textarea", label: "SQL 입력", rows: 8, default: SAMPLE },
  ],
  run(v) {
    const sql = v.sql || "";
    const out = [{ label: "포맷된 SQL", type: "code", value: format(sql) }];
    const issues = lint(sql);
    if (issues.length) {
      out.push({
        label: "린트 경고",
        type: "list",
        value: issues.map((i) => `[${i.rule}] ${i.message}`),
      });
      out.push({ label: "린트 상태", type: "badge", value: `경고 ${issues.length}`, tone: "warn" });
    } else {
      out.push({ label: "린트 상태", type: "badge", value: "통과", tone: "good" });
    }
    return out;
  },
};
