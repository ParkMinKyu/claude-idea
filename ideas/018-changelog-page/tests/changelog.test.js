import { describe, it, expect } from "vitest";
import { parseFrontmatter, slugify, summarize, buildRss } from "../src/changelog.js";

describe("parseFrontmatter", () => {
  it("parses scalar and array values", () => {
    const src = `---\ntitle: "v1.2.0"\ntags: [feature, fix]\n---\n# Hello\nbody`;
    const { meta, body } = parseFrontmatter(src);
    expect(meta.title).toBe("v1.2.0");
    expect(meta.tags).toEqual(["feature", "fix"]);
    expect(body.startsWith("# Hello")).toBe(true);
  });
  it("returns empty meta when missing", () => {
    expect(parseFrontmatter("just body").meta).toEqual({});
  });
});

describe("slugify", () => {
  it("normalizes spaces and case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips punctuation", () => {
    expect(slugify("v1.2.0! Released")).toBe("v120-released");
  });
});

describe("summarize", () => {
  it("strips markdown and truncates", () => {
    const body = "# Title\n\nThis is **bold** and [a link](http://x). ".repeat(20);
    const s = summarize(body, 50);
    expect(s.length).toBeLessThanOrEqual(50);
    expect(s).not.toMatch(/[#*]/);
  });
});

describe("buildRss", () => {
  it("produces valid xml with items", () => {
    const xml = buildRss({
      site: "https://example.com",
      title: "Changelog",
      description: "Updates",
      entries: [{ title: "v1", slug: "v1", date: "2026-01-01", summary: "first" }],
    });
    expect(xml).toMatch(/<rss/);
    expect(xml).toMatch(/<title>v1<\/title>/);
    expect(xml).toMatch(/https:\/\/example.com\/changelog\/v1/);
  });
  it("escapes special characters", () => {
    const xml = buildRss({
      site: "https://x",
      title: "t",
      description: "d",
      entries: [{ title: "a & b", date: "2026-01-01", summary: "<x>" }],
    });
    expect(xml).toMatch(/a &amp; b/);
    expect(xml).toMatch(/&lt;x&gt;/);
  });
});
