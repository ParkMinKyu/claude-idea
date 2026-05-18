import { describe, it, expect } from "vitest";
import { extractMeta, suggestTags, buildSearchQuery } from "../src/bookmarks.js";

const html = `<html><head>
<title>Awesome Article &amp; Things</title>
<meta name="description" content="A guide to rust async runtimes." />
<meta property="og:image" content="https://x.com/cover.png" />
</head><body><p>tokio async runtime rust</p></body></html>`;

describe("extractMeta", () => {
  it("parses title, description, image, domain", () => {
    const meta = extractMeta(html, "https://www.example.com/post/1");
    expect(meta.title).toBe("Awesome Article & Things");
    expect(meta.description).toContain("rust async");
    expect(meta.image).toBe("https://x.com/cover.png");
    expect(meta.domain).toBe("example.com");
  });

  it("falls back to URL when no title", () => {
    const meta = extractMeta("<html></html>", "https://example.com/x");
    expect(meta.title).toBe("https://example.com/x");
  });
});

describe("suggestTags", () => {
  it("returns top frequency keywords", () => {
    const tags = suggestTags("rust rust async runtime rust async tokio", 3);
    expect(tags[0]).toBe("rust");
    expect(tags).toContain("async");
  });

  it("filters stopwords and short words", () => {
    const tags = suggestTags("the a is on for tokio tokio tokio");
    expect(tags).toEqual(["tokio"]);
  });

  it("handles Korean text", () => {
    const tags = suggestTags("러스트 러스트 비동기 비동기 비동기 토키오");
    expect(tags[0]).toBe("비동기");
  });
});

describe("buildSearchQuery", () => {
  it("encodes tag and domain filters", () => {
    const q = buildSearchQuery({ q: "rust", tags: ["async", "tokio"], domain: "x.com" });
    expect(q.q).toBe("rust");
    expect(q.filters).toContain('tags = "async"');
    expect(q.filters).toContain('domain = "x.com"');
  });

  it("omits empty filters", () => {
    const q = buildSearchQuery({ q: "" });
    expect(q.filters).toEqual([]);
  });
});
