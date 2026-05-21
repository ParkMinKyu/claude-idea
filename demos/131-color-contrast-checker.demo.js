import { checkContrast } from "../ideas/131-color-contrast-checker/src/contrast.js";

const toneFor = (level) => (level === "AAA" ? "good" : level === "AA" ? "warn" : "bad");

window.__DEMO_SPEC__ = {
  description:
    "전경/배경 색상의 WCAG 2.1 명도 대비(contrast ratio)를 계산하고, 일반/큰 텍스트에 대한 AA·AAA 등급을 판정합니다.",
  fields: [
    { name: "fg", type: "text", label: "전경색 (텍스트)", placeholder: "#333333", default: "#5b6470" },
    { name: "bg", type: "text", label: "배경색", placeholder: "#ffffff", default: "#ffffff" },
  ],
  run(v) {
    let res;
    try {
      res = checkContrast(v.fg, v.bg);
    } catch (e) {
      return [{ label: "오류", type: "error", value: "색상 파싱 실패: " + e.message }];
    }
    return [
      { label: "명도 대비", type: "badge", value: `${res.ratio}:1`, tone: res.normal.AA ? "good" : "bad" },
      {
        label: "일반 텍스트",
        type: "badge",
        value: res.normal.level === "fail" ? "기준 미달" : res.normal.level,
        tone: toneFor(res.normal.level),
      },
      {
        label: "큰 텍스트 (18pt+)",
        type: "badge",
        value: res.large.level === "fail" ? "기준 미달" : res.large.level,
        tone: toneFor(res.large.level),
      },
      {
        label: "상세",
        type: "list",
        value: [
          `일반 텍스트 AA(4.5:1): ${res.normal.AA ? "통과" : "실패"}`,
          `일반 텍스트 AAA(7:1): ${res.normal.AAA ? "통과" : "실패"}`,
          `큰 텍스트 AA(3:1): ${res.large.AA ? "통과" : "실패"}`,
          `큰 텍스트 AAA(4.5:1): ${res.large.AAA ? "통과" : "실패"}`,
        ],
      },
      {
        label: "미리보기",
        type: "html",
        value: `<div style="background:${v.bg};color:${v.fg};padding:24px;border-radius:8px;font-size:16px;font-family:sans-serif">일반 텍스트 — 다람쥐 헌 쳇바퀴에 타고파<br><span style="font-size:28px;font-weight:700">큰 텍스트 — 큰 제목</span></div>`,
      },
    ];
  },
};
