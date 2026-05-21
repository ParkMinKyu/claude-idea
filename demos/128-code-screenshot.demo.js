import { renderSvg } from "../ideas/128-code-screenshot/src/render.js";

window.__DEMO_SPEC__ = {
  description: "코드를 휴리스틱 토크나이저로 하이라이트하고 macOS 창 스타일의 SVG 코드 스크린샷으로 렌더링합니다.",
  fields: [
    {
      name: "code",
      type: "textarea",
      label: "코드",
      rows: 10,
      default: [
        "// 피보나치 수열",
        "function fib(n) {",
        "  if (n < 2) return n;",
        '  const msg = "계산 중...";',
        "  return fib(n - 1) + fib(n - 2);",
        "}",
        "export const result = fib(10);",
      ].join("\n"),
    },
    {
      name: "theme",
      type: "select",
      label: "테마",
      default: "dark",
      options: [
        { label: "다크", value: "dark" },
        { label: "라이트", value: "light" },
      ],
    },
    {
      name: "lineNumbers",
      type: "select",
      label: "줄 번호",
      default: "true",
      options: [
        { label: "표시", value: "true" },
        { label: "숨김", value: "false" },
      ],
    },
  ],
  run(v) {
    const { svg, width, height, lines } = renderSvg(v.code || "", {
      theme: v.theme || "dark",
      lineNumbers: v.lineNumbers !== "false",
    });
    return [
      { label: "크기", type: "badge", value: `${width}×${height}px · ${lines}줄`, tone: "neutral" },
      { label: "코드 스크린샷", type: "svg", value: svg },
    ];
  },
};
