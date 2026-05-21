import { renderBadge, coverageBadge } from "../ideas/116-status-badge-gen/src/lib/badge.ts";

window.__DEMO_SPEC__ = {
  description:
    "shields.io 스타일의 평면(flat) SVG 상태 배지를 생성합니다. 라벨/메시지/색상을 입력하면 즉시 SVG로 렌더링됩니다.",
  fields: [
    { name: "label", type: "text", label: "라벨", default: "build" },
    { name: "message", type: "text", label: "메시지", default: "passing" },
    {
      name: "color",
      type: "select",
      label: "메시지 색상",
      default: "brightgreen",
      options: [
        { value: "brightgreen", label: "brightgreen" },
        { value: "green", label: "green" },
        { value: "yellow", label: "yellow" },
        { value: "orange", label: "orange" },
        { value: "red", label: "red" },
        { value: "blue", label: "blue" },
        { value: "lightgrey", label: "lightgrey" },
      ],
    },
    { name: "coverage", type: "number", label: "커버리지 배지 (%)", default: 87 },
  ],
  run(v) {
    const svg = renderBadge({
      label: v.label || "",
      message: v.message || "",
      color: v.color || "blue",
    });
    const cov = Number(v.coverage);
    const out = [{ label: "상태 배지", type: "svg", value: svg }];
    if (!Number.isNaN(cov)) {
      out.push({ label: "커버리지 배지 (자동 색상)", type: "svg", value: coverageBadge(cov) });
    }
    out.push({ label: "SVG 소스", type: "code", value: svg });
    return out;
  },
};
