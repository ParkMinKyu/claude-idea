import { generate } from "../ideas/133-og-image-gen/src/og.js";

window.__DEMO_SPEC__ = {
  description:
    "제목/부제목/색상/템플릿 파라미터로부터 1200×630 OG(Open Graph) 소셜 미리보기 이미지를 SVG로 렌더링합니다.",
  fields: [
    { name: "title", type: "text", label: "제목", default: "브라우저에서 실행되는 데모" },
    { name: "subtitle", type: "text", label: "부제목", default: "claude-idea · OG 이미지 생성기" },
    { name: "bg", type: "text", label: "배경색", default: "#0f172a" },
    { name: "fg", type: "text", label: "글자색", default: "#f8fafc" },
    { name: "accent", type: "text", label: "강조색", default: "#38bdf8" },
    {
      name: "template",
      type: "select",
      label: "템플릿",
      default: "basic",
      options: [
        { value: "basic", label: "basic" },
        { value: "split", label: "split" },
        { value: "minimal", label: "minimal" },
      ],
    },
  ],
  run(v) {
    let svg;
    try {
      svg = generate({
        title: v.title,
        subtitle: v.subtitle,
        bg: v.bg,
        fg: v.fg,
        accent: v.accent,
        template: v.template,
      });
    } catch (e) {
      return [{ label: "오류", type: "error", value: "렌더링 실패: " + e.message }];
    }
    return [
      { label: "OG 이미지 (SVG)", type: "svg", value: svg },
      { label: "SVG 소스", type: "code", value: svg },
    ];
  },
};
