import {
  renderMarkdown,
  extractToc,
  toPlainText,
} from "../ideas/107-markdown-preview-api/src/render.js";

const SAMPLE_MD = `# 마크다운 미리보기

이것은 **안전하게** 정제된 _Markdown_ 렌더러입니다.

## 기능
- GFM 표 지원
- XSS 위험 태그 제거
- 코드 블록

\`\`\`js
console.log("안녕하세요");
\`\`\`

> 인용문도 됩니다.

[링크](https://example.com)
`;

window.__DEMO_SPEC__ = {
  description:
    "Markdown을 XSS 안전하게 정제된 HTML로 변환하고, 목차(TOC)와 본문 요약을 추출합니다.",
  fields: [
    {
      name: "markdown",
      type: "textarea",
      label: "Markdown 입력",
      rows: 12,
      default: SAMPLE_MD,
    },
  ],
  run(v) {
    let html;
    try {
      html = renderMarkdown(v.markdown ?? "");
    } catch (e) {
      return [{ label: "렌더 오류", type: "error", value: String(e.message || e) }];
    }
    const toc = extractToc(v.markdown ?? "");
    return [
      { label: "미리보기 (정제된 HTML)", type: "html", value: html },
      { label: "요약", type: "text", value: toPlainText(v.markdown ?? "") },
      {
        label: "목차 (TOC)",
        type: "json",
        value: toc.length ? toc : "헤딩이 없습니다.",
      },
      { label: "정제된 HTML 소스", type: "code", value: html },
    ];
  },
};
