import { evaluate, bucket } from "../ideas/113-feature-flag-lite/src/lib/engine.ts";

const SAMPLE_FLAG = JSON.stringify(
  {
    key: "new-checkout",
    enabled: true,
    defaultValue: false,
    rules: [
      {
        conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
        serve: true,
      },
      {
        conditions: [{ attribute: "country", operator: "in", value: ["KR", "JP"] }],
        rollout: 50,
        serve: "beta",
      },
    ],
  },
  null,
  2
);

const SAMPLE_CTX = JSON.stringify({ userId: "user-123", plan: "free", country: "KR" }, null, 2);

window.__DEMO_SPEC__ = {
  description:
    "플래그 정의(JSON)와 사용자 컨텍스트(JSON)를 입력하면 규칙 엔진이 조건/롤아웃 버킷을 평가하여 서빙 값과 사유를 결정합니다.",
  fields: [
    { name: "flag", type: "textarea", label: "플래그 정의 (JSON)", rows: 14, default: SAMPLE_FLAG },
    { name: "ctx", type: "textarea", label: "사용자 컨텍스트 (JSON)", rows: 5, default: SAMPLE_CTX },
  ],
  run(v) {
    let flag, ctx;
    try {
      flag = JSON.parse(v.flag || "");
    } catch (e) {
      return [{ label: "플래그 파싱 오류", type: "error", value: e.message }];
    }
    try {
      ctx = JSON.parse(v.ctx || "{}");
    } catch (e) {
      return [{ label: "컨텍스트 파싱 오류", type: "error", value: e.message }];
    }
    let res;
    try {
      res = evaluate(flag, ctx);
    } catch (e) {
      return [{ label: "평가 오류", type: "error", value: e.message }];
    }
    const toneByReason = {
      rule_match: "good",
      default: "neutral",
      disabled: "bad",
      rollout_excluded: "warn",
    };
    return [
      {
        label: "서빙 값",
        type: "badge",
        value: String(res.value),
        tone: res.value === true || typeof res.value === "string" ? "good" : "neutral",
      },
      { label: "사유", type: "badge", value: res.reason, tone: toneByReason[res.reason] ?? "neutral" },
      {
        label: "롤아웃 버킷 (0-99)",
        type: "text",
        value: String(bucket(flag.key, ctx.userId ?? "")),
      },
      { label: "전체 결과", type: "json", value: res },
    ];
  },
};
