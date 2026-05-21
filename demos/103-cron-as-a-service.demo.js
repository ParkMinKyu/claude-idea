import { parseCron, nextRuns } from "../ideas/103-cron-as-a-service/src/cron.js";

window.__DEMO_SPEC__ = {
  description:
    "5필드 cron 표현식을 파싱하고 다음 실행 시각(UTC)을 계산합니다. 의존성 없는 순수 파서입니다.",
  fields: [
    {
      name: "expression",
      type: "text",
      label: "cron 표현식 (분 시 일 월 요일)",
      placeholder: "0 9 * * 1-5",
      default: "0 9 * * 1-5",
    },
    { name: "count", type: "number", label: "다음 실행 횟수", default: 5 },
  ],
  run(v) {
    const count = Math.max(1, Math.min(20, Number(v.count) || 5));
    let parsed;
    try {
      parsed = parseCron(v.expression);
    } catch (e) {
      return [{ label: "cron 파싱 오류", type: "error", value: String(e.message || e) }];
    }
    let runs;
    try {
      runs = nextRuns(v.expression, count, new Date());
    } catch (e) {
      return [{ label: "계산 오류", type: "error", value: String(e.message || e) }];
    }
    return [
      { label: "유효성", type: "badge", value: "유효한 표현식", tone: "good" },
      { label: "정규화된 표현식", type: "code", value: parsed.raw },
      {
        label: `다음 ${count}회 실행 (UTC)`,
        type: "list",
        value: runs.map((d) => d.toISOString()),
      },
    ];
  },
};
