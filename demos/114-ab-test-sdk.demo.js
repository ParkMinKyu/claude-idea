import { assign } from "../ideas/114-ab-test-sdk/src/lib/assign.ts";
import { analyze, sampleSizePerArm } from "../ideas/114-ab-test-sdk/src/lib/stats.ts";

window.__DEMO_SPEC__ = {
  description:
    "결정론적 해시(FNV-1a)로 사용자를 실험 변형에 배정하고, 두 집단의 전환 데이터로 상대 향상도/Z-점수/p-value/유의성을 분석합니다.",
  fields: [
    { name: "expKey", type: "text", label: "실험 키", default: "checkout-cta" },
    { name: "userId", type: "text", label: "사용자 ID", default: "user-123" },
    {
      name: "variants",
      type: "text",
      label: "변형 (key:weight, 쉼표 구분)",
      default: "control:1, treatment:1",
    },
    { name: "allocation", type: "number", label: "트래픽 배정 비율 (0-1)", default: 1 },
    { name: "cConv", type: "number", label: "대조군 전환수", default: 120 },
    { name: "cVis", type: "number", label: "대조군 방문수", default: 2000 },
    { name: "tConv", type: "number", label: "실험군 전환수", default: 160 },
    { name: "tVis", type: "number", label: "실험군 방문수", default: 2000 },
  ],
  run(v) {
    const variants = String(v.variants || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => {
        const [key, w] = p.split(":");
        return { key: key.trim(), weight: Number(w ?? 1) || 1 };
      });
    const exp = {
      key: v.expKey || "exp",
      variants: variants.length ? variants : [{ key: "control", weight: 1 }],
      allocation: v.allocation == null ? 1 : Number(v.allocation),
    };
    const a = assign(exp, v.userId || "");

    const res = analyze(
      { conversions: Number(v.cConv) || 0, visitors: Number(v.cVis) || 0 },
      { conversions: Number(v.tConv) || 0, visitors: Number(v.tVis) || 0 }
    );
    const pct = (x) => (x * 100).toFixed(2) + "%";
    const n = sampleSizePerArm(res.controlRate || 0.05, 0.02);

    return [
      {
        label: "변형 배정",
        type: "badge",
        value: a.enrolled ? a.variant : "미참여",
        tone: a.enrolled ? "good" : "neutral",
      },
      {
        label: "유의성 (α=0.05)",
        type: "badge",
        value: res.significant ? "유의함" : "유의하지 않음",
        tone: res.significant ? "good" : "warn",
      },
      {
        label: "전환율",
        type: "list",
        value: [
          `대조군: ${pct(res.controlRate)}`,
          `실험군: ${pct(res.treatmentRate)}`,
          `상대 향상도: ${pct(res.relativeUplift)}`,
          `Z-점수: ${res.zScore.toFixed(3)}`,
          `p-value: ${res.pValue.toFixed(4)}`,
        ],
      },
      {
        label: "권장 표본 크기 (arm당, MDE 2%p)",
        type: "text",
        value: String(n),
      },
      { label: "분석 결과", type: "json", value: { assignment: a, analysis: res } },
    ];
  },
};
