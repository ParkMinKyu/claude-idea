import { lint, summarize } from "../ideas/108-openapi-linter/src/rules.js";

const SAMPLE = JSON.stringify(
  {
    openapi: "3.0.3",
    info: { title: "Sample API", version: "1.0.0" },
    paths: {
      "/users/{id}": {
        get: { responses: { "404": { description: "not found" } } },
        delete: { operationId: "rm", responses: { "204": { description: "ok" } } },
      },
      "/users": {
        get: { operationId: "rm", responses: { "200": { description: "ok" } } },
      },
    },
  },
  null,
  2
);

window.__DEMO_SPEC__ = {
  description:
    "OpenAPI 3.x 스펙(JSON)을 붙여넣으면 규칙 엔진으로 린트하여 누락된 operationId, 2xx 응답, 경로 파라미터 등의 문제를 찾아줍니다.",
  fields: [
    { name: "spec", type: "textarea", label: "OpenAPI JSON", rows: 14, default: SAMPLE },
  ],
  run(v) {
    let spec;
    try {
      spec = JSON.parse(v.spec || "");
    } catch (e) {
      return [{ label: "파싱 오류", type: "error", value: "JSON 파싱 실패: " + e.message }];
    }
    let issues;
    try {
      issues = lint(spec);
    } catch (e) {
      return [{ label: "린트 오류", type: "error", value: e.message }];
    }
    const sum = summarize(issues);
    const out = [
      {
        label: "결과",
        type: "badge",
        value: sum.ok ? "통과" : `오류 ${sum.errors} / 경고 ${sum.warnings}`,
        tone: sum.ok ? "good" : sum.errors ? "bad" : "warn",
      },
    ];
    if (issues.length) {
      out.push({
        label: "발견된 문제",
        type: "list",
        value: issues.map(
          (i) => `[${i.severity}] ${i.ruleId} @ ${i.path} — ${i.message}`
        ),
      });
    } else {
      out.push({ label: "문제 없음", type: "text", value: "모든 규칙을 통과했습니다." });
    }
    return out;
  },
};
