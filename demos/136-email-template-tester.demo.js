import { Buffer } from "buffer";
globalThis.Buffer = globalThis.Buffer || Buffer;
import { report } from "../ideas/136-email-template-tester/src/lint.js";

const DEFAULT_HTML = `<html>
  <head>
    <link rel="stylesheet" href="https://cdn.example.com/email.css">
  </head>
  <body>
    <style>.box{display:flex}</style>
    <div style="display:flex; position:absolute; top:0">
      <img src="https://example.com/logo.png">
      <h1>안녕하세요!</h1>
    </div>
    <script>console.log("hi")</script>
  </body>
</html>`;

const toneBySeverity = { error: "bad", warning: "warn", info: "neutral" };

window.__DEMO_SPEC__ = {
  description:
    "이메일 HTML을 검사해 Outlook/Gmail/Apple Mail 등 주요 클라이언트에서 깨질 수 있는 요소(외부 스타일시트, flex/grid, script 등)를 경고합니다.",
  fields: [
    { name: "html", type: "textarea", label: "이메일 HTML", rows: 14, default: DEFAULT_HTML },
  ],
  run(v) {
    let res;
    try {
      res = report(String(v.html ?? ""));
    } catch (e) {
      return [{ label: "오류", type: "error", value: e.message }];
    }
    const out = [
      {
        label: "검사 결과",
        type: "badge",
        value: res.passed ? "통과 (오류 없음)" : `실패 (오류 ${res.counts.error}건)`,
        tone: res.passed ? "good" : "bad",
      },
      {
        label: "요약",
        type: "text",
        value: `오류 ${res.counts.error} · 경고 ${res.counts.warning} · 정보 ${res.counts.info} · 크기 ${res.sizeKb}KB`,
      },
    ];
    if (res.findings.length) {
      out.push({
        label: "발견된 문제",
        type: "json",
        value: res.findings.map((f) => ({
          severity: f.severity,
          rule: f.rule,
          clients: f.clients,
          message: f.message,
        })),
      });
      const top = res.findings[0];
      out.push({
        label: "대표 항목",
        type: "badge",
        value: `${top.severity}: ${top.rule}`,
        tone: toneBySeverity[top.severity] || "neutral",
      });
    } else {
      out.push({ label: "발견된 문제", type: "text", value: "호환성 문제가 발견되지 않았습니다." });
    }
    return out;
  },
};
