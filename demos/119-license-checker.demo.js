import { auditProject, checkCompatibility } from "../ideas/119-license-checker/src/lib/spdx.ts";

window.__DEMO_SPEC__ = {
  description: "프로젝트 라이선스와 의존성 라이선스(SPDX)들의 호환성을 분석해 부적합/검토 필요 항목을 가려냅니다.",
  fields: [
    { name: "project", type: "text", label: "프로젝트 라이선스", default: "MIT" },
    {
      name: "deps",
      type: "textarea",
      label: "의존성 라이선스 (줄당 1개)",
      rows: 6,
      default: ["MIT", "Apache-2.0", "ISC", "MPL-2.0", "GPL-3.0", "WTFPL"].join("\n"),
    },
  ],
  run(v) {
    const deps = (v.deps || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const audit = auditProject(v.project || "MIT", deps);
    const toneOf = (verdict) => (verdict === "compatible" ? "good" : verdict === "review" ? "warn" : "bad");
    return [
      {
        label: "전체 판정",
        type: "badge",
        value: audit.passed ? "통과 (부적합 없음)" : `부적합 ${audit.incompatible}건`,
        tone: audit.passed ? (audit.review ? "warn" : "good") : "bad",
      },
      {
        label: "요약",
        type: "text",
        value: `부적합:${audit.incompatible} 검토필요:${audit.review} 통과:${audit.results.length - audit.incompatible - audit.review}`,
      },
      {
        label: "의존성별 결과",
        type: "list",
        value: audit.results.map((r) => `${r.dependency.id} [${r.verdict}] — ${r.reason}`),
      },
    ];
  },
};
