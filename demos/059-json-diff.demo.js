import { diff, summarize, changedOnly } from "../ideas/059-json-diff/src/lib/diff.ts";

window.__DEMO_SPEC__ = {
  description: "두 JSON 객체를 비교해 추가/삭제/변경된 필드를 경로별로 보여줍니다.",
  fields: [
    {
      name: "left",
      type: "textarea",
      label: "왼쪽 JSON (이전)",
      rows: 8,
      default: JSON.stringify(
        { name: "홍길동", age: 30, roles: ["user"], addr: { city: "서울" } },
        null,
        2
      ),
    },
    {
      name: "right",
      type: "textarea",
      label: "오른쪽 JSON (이후)",
      rows: 8,
      default: JSON.stringify(
        { name: "홍길동", age: 31, roles: ["user", "admin"], addr: { city: "부산" } },
        null,
        2
      ),
    },
  ],
  run(v) {
    let left, right;
    try {
      left = JSON.parse(v.left);
    } catch (e) {
      return [{ label: "왼쪽 JSON 파싱 오류", type: "error", value: String(e.message || e) }];
    }
    try {
      right = JSON.parse(v.right);
    } catch (e) {
      return [{ label: "오른쪽 JSON 파싱 오류", type: "error", value: String(e.message || e) }];
    }
    const changes = diff(left, right);
    const s = summarize(changes);
    const diffs = changedOnly(changes);
    return [
      {
        label: "요약",
        type: "badge",
        value: `추가 ${s.added} · 삭제 ${s.removed} · 변경 ${s.changed} · 동일 ${s.same}`,
        tone: diffs.length ? "warn" : "good",
      },
      {
        label: "변경 내역",
        type: "json",
        value: diffs.length ? diffs : "차이가 없습니다.",
      },
    ];
  },
};
