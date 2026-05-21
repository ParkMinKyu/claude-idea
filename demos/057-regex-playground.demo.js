import { testPattern, toPython } from "../ideas/057-regex-playground/src/lib/regex.ts";

window.__DEMO_SPEC__ = {
  description:
    "정규식 패턴을 입력 텍스트에 적용해 매칭 결과를 확인하고, 동등한 Python 코드로 변환합니다.",
  fields: [
    {
      name: "pattern",
      type: "text",
      label: "정규식 패턴",
      placeholder: "\\d{4}-\\d{2}-\\d{2}",
      default: "(\\d{4})-(\\d{2})-(\\d{2})",
    },
    { name: "flags", type: "text", label: "플래그 (예: gi)", default: "g" },
    {
      name: "input",
      type: "textarea",
      label: "입력 텍스트",
      rows: 4,
      default: "오늘은 2026-05-21 이고 마감일은 2026-06-30 입니다.",
    },
  ],
  run(v) {
    const res = testPattern(v.pattern, v.flags || "", v.input);
    if (!res.valid) {
      return [{ label: "정규식 오류", type: "error", value: res.error || "잘못된 패턴" }];
    }
    const out = [
      {
        label: "매칭 개수",
        type: "badge",
        value: String(res.matches.length),
        tone: res.matches.length ? "good" : "warn",
      },
    ];
    if (res.matches.length) {
      out.push({
        label: "매칭 결과",
        type: "json",
        value: res.matches,
      });
    }
    out.push({ label: "Python 변환", type: "code", value: toPython(v.pattern, v.flags || "") });
    return out;
  },
};
