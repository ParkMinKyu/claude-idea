import { parseDependencies, auditDependencies, summarize } from "../ideas/118-dependency-audit/src/lib/audit.ts";
import { MOCK_VULN_DB } from "../ideas/118-dependency-audit/src/lib/mock-db.ts";

window.__DEMO_SPEC__ = {
  description: "package.json 의존성을 내장 모의 취약점 DB(lodash·minimist·left-pad·serialize-javascript)와 대조해 취약점을 찾아냅니다.",
  fields: [
    {
      name: "pkg",
      type: "textarea",
      label: "package.json",
      rows: 12,
      default: JSON.stringify(
        {
          name: "my-app",
          dependencies: {
            lodash: "^4.17.11",
            "serialize-javascript": "3.0.0",
            "left-pad": "1.3.0",
            react: "^18.2.0",
          },
          devDependencies: {
            minimist: "1.2.0",
          },
        },
        null,
        2
      ),
    },
  ],
  run(v) {
    let pkg;
    try {
      pkg = JSON.parse(v.pkg || "{}");
    } catch (e) {
      return [{ label: "오류", type: "error", value: "package.json JSON 파싱 실패: " + e.message }];
    }
    const findings = auditDependencies(parseDependencies(pkg), MOCK_VULN_DB);
    const summary = summarize(findings);
    const out = [
      {
        label: "최고 심각도",
        type: "badge",
        value: summary.highestSeverity ? summary.highestSeverity : "취약점 없음",
        tone: summary.highestSeverity === "critical" || summary.highestSeverity === "high"
          ? "bad"
          : summary.highestSeverity
          ? "warn"
          : "good",
      },
      {
        label: "요약",
        type: "text",
        value: `총 ${summary.total}건 — critical:${summary.bySeverity.critical} high:${summary.bySeverity.high} moderate:${summary.bySeverity.moderate} low:${summary.bySeverity.low}`,
      },
    ];
    if (findings.length) {
      out.push({
        label: "발견된 취약점",
        type: "list",
        value: findings.map(
          (f) => `[${f.vulnerability.severity}] ${f.package}@${f.resolvedVersion} ${f.vulnerability.id}: ${f.vulnerability.title} → ${f.recommendation}`
        ),
      });
    }
    return out;
  },
};
