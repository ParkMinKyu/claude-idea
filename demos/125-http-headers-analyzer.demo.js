import { analyzeHeaders } from "../ideas/125-http-headers-analyzer/src/analyze.js";

// Parse a raw HTTP response header block into a { name: value } object.
function parseRawHeaders(raw) {
  const headers = {};
  for (const line of String(raw || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip the HTTP status line (e.g. "HTTP/2 200").
    if (/^HTTP\//i.test(trimmed)) continue;
    const idx = trimmed.indexOf(":");
    if (idx < 0) continue;
    const name = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (name) headers[name] = value;
  }
  return headers;
}

window.__DEMO_SPEC__ = {
  description: "원시 HTTP 응답 헤더 텍스트를 붙여넣으면 보안 헤더(HSTS, CSP, X-Frame-Options 등)를 채점하고 등급을 매깁니다.",
  fields: [
    {
      name: "headers",
      type: "textarea",
      label: "HTTP 응답 헤더",
      rows: 10,
      default: [
        "HTTP/2 200",
        "server: nginx/1.21.0",
        "content-type: text/html; charset=utf-8",
        "x-powered-by: Express",
        "strict-transport-security: max-age=600",
        "content-security-policy: default-src 'self' 'unsafe-inline'",
        "x-content-type-options: nosniff",
      ].join("\n"),
    },
  ],
  run(v) {
    const headers = parseRawHeaders(v.headers);
    const report = analyzeHeaders(headers);
    const gradeTone = report.grade === "A" || report.grade === "B" ? "good" : report.grade === "C" || report.grade === "D" ? "warn" : "bad";
    return [
      { label: "보안 점수", type: "badge", value: `${report.score}/100`, tone: gradeTone },
      { label: "등급", type: "badge", value: report.grade, tone: gradeTone },
      {
        label: "보안 헤더 점검",
        type: "list",
        value: report.findings.map(
          (f) => `${f.present && f.severity === "ok" ? "✓" : "✗"} ${f.header}: ${f.message} (${f.points}/${f.max})`
        ),
      },
      ...(report.disclosures.length
        ? [{ label: "정보 노출 (감점)", type: "list", value: report.disclosures.map((d) => `${d.message} (${d.points})`) }]
        : []),
    ];
  },
};
