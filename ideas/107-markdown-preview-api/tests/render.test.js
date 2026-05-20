import { describe, it, expect } from "vitest";
import { renderMarkdown, extractToc, toPlainText } from "../src/render.js";
import { handleRender } from "../src/server.js";

describe("renderMarkdown basics", () => {
  it("renders headings, bold, and links", () => {
    const html = renderMarkdown("# Title\n\n**bold** and [link](https://example.com)");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders GFM tables", () => {
    const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });
});

describe("renderMarkdown XSS safety", () => {
  it("strips script tags", () => {
    const html = renderMarkdown("hello <script>alert(1)</script> world");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)");
  });

  it("removes javascript: links", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("strips event handler attributes", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });
});

describe("extractToc", () => {
  it("builds an outline with levels and slugs", () => {
    const toc = extractToc("# Intro\n## 설치 방법\ntext\n### Sub");
    expect(toc).toHaveLength(3);
    expect(toc[0]).toMatchObject({ level: 1, text: "Intro" });
    expect(toc[1].slug).toBe("설치-방법");
    expect(toc[2].level).toBe(3);
  });
});

describe("toPlainText", () => {
  it("strips markdown syntax and truncates", () => {
    const txt = toPlainText("# Hello\n\nThis is **bold** and `code`.");
    expect(txt).not.toContain("#");
    expect(txt).not.toContain("**");
    expect(txt).toContain("Hello");
  });
});

describe("handleRender", () => {
  it("returns html, toc, and excerpt", () => {
    const out = handleRender({ markdown: "# H\n\ntext here", toc: true });
    expect(out.html).toContain("<h1>H</h1>");
    expect(out.toc[0].text).toBe("H");
    expect(out.excerpt).toContain("text here");
  });
});
