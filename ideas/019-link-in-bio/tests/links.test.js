import { describe, it, expect } from "vitest";
import { validateLink, reorder, detectIcon, parseReferrer, buildPage } from "../src/links.js";

describe("validateLink", () => {
  it("accepts valid link", () => {
    expect(validateLink({ title: "Home", url: "https://example.com" })).toEqual([]);
  });
  it("rejects non-http url", () => {
    expect(validateLink({ title: "x", url: "javascript:alert(1)" })).toContain("url must be http(s)");
  });
  it("requires title", () => {
    expect(validateLink({ url: "https://x" })).toContain("title required");
  });
});

describe("reorder", () => {
  const links = [
    { id: "a", position: 0 },
    { id: "b", position: 1 },
    { id: "c", position: 2 },
  ];
  it("moves item to new index", () => {
    const r = reorder(links, "a", 2);
    expect(r.map((l) => l.id)).toEqual(["b", "c", "a"]);
    expect(r.map((l) => l.position)).toEqual([0, 1, 2]);
  });
  it("throws on unknown id", () => {
    expect(() => reorder(links, "z", 0)).toThrow();
  });
});

describe("detectIcon", () => {
  it("identifies known providers", () => {
    expect(detectIcon("https://www.youtube.com/watch?v=1")).toBe("youtube");
    expect(detectIcon("https://x.com/me")).toBe("twitter");
    expect(detectIcon("https://buy.stripe.com/abc")).toBe("stripe");
  });
  it("falls back to link", () => {
    expect(detectIcon("https://random.example/path")).toBe("link");
  });
});

describe("parseReferrer", () => {
  it("detects utm source", () => {
    expect(parseReferrer("https://x.com/a?utm_source=newsletter&utm_medium=email")).toEqual({
      source: "newsletter",
      medium: "email",
    });
  });
  it("classifies social", () => {
    expect(parseReferrer("https://instagram.com/me").medium).toBe("social");
  });
  it("handles missing referrer", () => {
    expect(parseReferrer(null)).toEqual({ source: "direct", medium: "none" });
  });
});

describe("buildPage", () => {
  it("returns sorted enabled links with icons", () => {
    const page = buildPage(
      { slug: "me", displayName: "Me", theme: "dark" },
      [
        { id: "1", title: "YT", url: "https://youtube.com/me", position: 1 },
        { id: "2", title: "GH", url: "https://github.com/me", position: 0 },
      ],
    );
    expect(page.links[0].title).toBe("GH");
    expect(page.links[0].icon).toBe("github");
  });
});
