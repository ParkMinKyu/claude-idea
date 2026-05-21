import { Buffer } from "buffer";
globalThis.Buffer = globalThis.Buffer || Buffer;
import { parseCron } from "../ideas/056-cron-debugger/src/lib/cron.ts";

window.__DEMO_SPEC__ = {
  description:
    "cron 표현식을 사람이 읽을 수 있는 설명(한국어/영어)으로 풀고, 다음 실행 시각을 계산합니다.",
  fields: [
    {
      name: "expression",
      type: "text",
      label: "cron 표현식",
      placeholder: "*/15 9-18 * * 1-5",
      default: "*/15 9-18 * * 1-5",
    },
    {
      name: "tz",
      type: "select",
      label: "타임존",
      default: "Asia/Seoul",
      options: [
        { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
        { value: "UTC", label: "UTC" },
        { value: "America/New_York", label: "America/New_York" },
      ],
    },
    { name: "count", type: "number", label: "다음 실행 횟수", default: 5 },
  ],
  run(v) {
    const count = Math.max(1, Math.min(20, Number(v.count) || 5));
    const res = parseCron(v.expression, { count, tz: v.tz });
    if (!res.valid) {
      return [{ label: "오류", type: "error", value: res.error || "잘못된 cron 표현식" }];
    }
    return [
      { label: "유효성", type: "badge", value: "유효한 표현식", tone: "good" },
      { label: "설명 (한국어)", type: "text", value: res.descriptionKo },
      { label: "설명 (English)", type: "text", value: res.description },
      { label: `다음 ${count}회 실행 (${v.tz})`, type: "list", value: res.nextRuns },
    ];
  },
};
