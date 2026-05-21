import { extractMetrics } from "../ideas/126-lighthouse-ci/src/metrics.js";
import { evaluate } from "../ideas/126-lighthouse-ci/src/assert.js";
import { toMarkdown } from "../ideas/126-lighthouse-ci/src/report.js";

const DEFAULT_LHR = JSON.stringify(
  {
    categories: { performance: { score: 0.78 } },
    audits: {
      "largest-contentful-paint": { numericValue: 3200 },
      "cumulative-layout-shift": { numericValue: 0.18 },
      "total-blocking-time": { numericValue: 410 },
      "first-contentful-paint": { numericValue: 1800 },
    },
  },
  null,
  2
);

const DEFAULT_BUDGETS = JSON.stringify(
  [
    { metric: "performance", min: 0.9 },
    { metric: "lcp", max: 2500 },
    { metric: "cls", max: 0.1 },
    { metric: "tbt", max: 300 },
  ],
  null,
  2
);

window.__DEMO_SPEC__ = {
  description:
    "Lighthouse 결과 JSON에서 핵심 성능 지표를 추출하고, 성능 버짓(budget)과 대조해 통과/실패 어설션을 생성합니다.",
  fields: [
    {
      name: "lhr",
      type: "textarea",
      label: "Lighthouse 결과 JSON",
      rows: 10,
      default: DEFAULT_LHR,
    },
    {
      name: "budgets",
      type: "textarea",
      label: "성능 버짓 (배열 JSON)",
      rows: 6,
      default: DEFAULT_BUDGETS,
    },
  ],
  run(v) {
    let lhr, budgets;
    try {
      lhr = JSON.parse(v.lhr);
    } catch (e) {
      return [{ label: "오류", type: "error", value: "결과 JSON 파싱 실패: " + e.message }];
    }
    try {
      budgets = v.budgets && v.budgets.trim() ? JSON.parse(v.budgets) : [];
    } catch (e) {
      return [{ label: "오류", type: "error", value: "버짓 JSON 파싱 실패: " + e.message }];
    }

    const metrics = extractMetrics(lhr);
    const result = evaluate(metrics, { budgets });

    const out = [
      {
        label: "검사 결과",
        type: "badge",
        value: result.passed ? "통과" : `실패 (위반 ${result.violations.length}건)`,
        tone: result.passed ? "good" : "bad",
      },
      { label: "추출된 지표", type: "json", value: metrics },
    ];
    out.push({
      label: "버짓 어설션",
      type: "list",
      value: result.violations.length
        ? result.violations.map((vi) => vi.message)
        : ["모든 버짓을 만족합니다."],
    });
    out.push({ label: "마크다운 리포트", type: "code", value: toMarkdown(result) });
    return out;
  },
};
