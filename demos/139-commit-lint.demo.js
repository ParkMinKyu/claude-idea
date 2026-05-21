import { lintCommit } from "../ideas/139-commit-lint/src/lint.js";

const DEFAULT_MSG = `feat(api): 사용자 검색 엔드포인트 추가

검색 쿼리 파라미터와 페이지네이션을 지원합니다.

BREAKING CHANGE: /users 응답 형식이 변경되었습니다.`;

window.__DEMO_SPEC__ = {
  description:
    "커밋 메시지를 Conventional Commits 규칙(type(scope): subject 형식, 헤더 길이, breaking change 등)으로 검증합니다.",
  fields: [
    { name: "message", type: "textarea", label: "커밋 메시지", rows: 8, default: DEFAULT_MSG },
    {
      name: "requireScope",
      type: "select",
      label: "scope 필수 여부",
      default: "false",
      options: [
        { value: "false", label: "선택" },
        { value: "true", label: "필수" },
      ],
    },
  ],
  run(v) {
    const res = lintCommit(String(v.message ?? ""), {
      requireScope: v.requireScope === "true",
    });
    const p = res.parsed;
    const out = [
      {
        label: "검증 결과",
        type: "badge",
        value: res.valid ? "유효한 커밋" : `유효하지 않음 (오류 ${res.errors.length}건)`,
        tone: res.valid ? "good" : "bad",
      },
    ];
    if (p.breaking) {
      out.push({ label: "Breaking Change", type: "badge", value: "있음", tone: "warn" });
    }
    out.push({
      label: "파싱 결과",
      type: "json",
      value: {
        type: p.type,
        scope: p.scope,
        subject: p.subject,
        breaking: p.breaking,
        body: p.body,
        footers: p.footers,
      },
    });
    if (res.errors.length) out.push({ label: "오류", type: "list", value: res.errors });
    if (res.warnings.length) out.push({ label: "경고", type: "list", value: res.warnings });
    if (!res.errors.length && !res.warnings.length)
      out.push({ label: "메모", type: "text", value: "규칙 위반이 없습니다." });
    return out;
  },
};
