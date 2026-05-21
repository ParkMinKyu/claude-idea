import { validateManifest, isPassing } from "../ideas/121-k8s-yaml-validator/src/validate.js";

window.__DEMO_SPEC__ = {
  description: "Kubernetes 매니페스트 YAML(다중 문서 가능)을 검증해 필수 필드, latest 태그, 리소스 제한, privileged 등 규칙으로 점수를 매깁니다.",
  fields: [
    {
      name: "yaml",
      type: "textarea",
      label: "Kubernetes 매니페스트 (YAML)",
      rows: 16,
      default: [
        "apiVersion: apps/v1",
        "kind: Deployment",
        "metadata:",
        "  name: web",
        "spec:",
        "  replicas: 2",
        "  template:",
        "    spec:",
        "      containers:",
        "        - name: app",
        "          image: nginx:latest",
        "          securityContext:",
        "            privileged: true",
        "---",
        "apiVersion: v1",
        "kind: Pod",
        "metadata:",
        "  name: tools",
        "spec:",
        "  containers:",
        "    - name: shell",
        "      image: busybox:1.36",
        "      resources:",
        "        limits:",
        "          cpu: 100m",
        "          memory: 64Mi",
      ].join("\n"),
    },
  ],
  run(v) {
    const report = validateManifest(v.yaml || "");
    return [
      {
        label: "점수",
        type: "badge",
        value: `${report.score}/100`,
        tone: report.score >= 80 ? "good" : report.score >= 50 ? "warn" : "bad",
      },
      {
        label: "통과 여부",
        type: "badge",
        value: isPassing(report) ? "PASS (에러 없음)" : "FAIL (에러 존재)",
        tone: isPassing(report) ? "good" : "bad",
      },
      {
        label: "요약",
        type: "text",
        value: `리소스 ${report.resourceCount}개 — error:${report.summary.error} warning:${report.summary.warning} info:${report.summary.info}`,
      },
      {
        label: "진단 결과",
        type: "list",
        value: report.items.length
          ? report.items.map((it) => `[${it.severity}] ${it.resource} :: ${it.rule} — ${it.message}`)
          : ["문제가 발견되지 않았습니다."],
      },
    ];
  },
};
