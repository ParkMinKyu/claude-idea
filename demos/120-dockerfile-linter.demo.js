import { parseDockerfile } from "../ideas/120-dockerfile-linter/src/lib/parser.ts";
import { lint, hasErrors } from "../ideas/120-dockerfile-linter/src/lib/rules.ts";

window.__DEMO_SPEC__ = {
  description: "Dockerfile을 파싱해 latest 태그, 비루트 USER, apt 캐시 정리, ADD/COPY 등 베스트 프랙티스 규칙으로 린트합니다.",
  fields: [
    {
      name: "dockerfile",
      type: "textarea",
      label: "Dockerfile",
      rows: 11,
      default: [
        "FROM node:latest",
        "WORKDIR /app",
        "RUN apt-get update && apt-get install -y curl",
        "ADD ./app.tar.gz /app",
        "COPY package.json .",
        "RUN npm install",
        'CMD ["node", "server.js"]',
      ].join("\n"),
    },
  ],
  run(v) {
    const violations = lint(parseDockerfile(v.dockerfile || ""));
    const counts = violations.reduce((m, x) => ((m[x.severity] = (m[x.severity] ?? 0) + 1), m), {});
    return [
      {
        label: "결과",
        type: "badge",
        value: hasErrors(violations, "error")
          ? "에러 있음"
          : violations.length
          ? `경고/정보 ${violations.length}건`
          : "통과",
        tone: hasErrors(violations, "error") ? "bad" : violations.length ? "warn" : "good",
      },
      {
        label: "요약",
        type: "text",
        value: `error:${counts.error ?? 0} warning:${counts.warning ?? 0} info:${counts.info ?? 0}`,
      },
      {
        label: "지적 사항",
        type: "list",
        value: violations.length
          ? violations.map((x) => `L${x.line} [${x.severity}] ${x.rule}: ${x.message}`)
          : ["문제가 발견되지 않았습니다."],
      },
    ];
  },
};
