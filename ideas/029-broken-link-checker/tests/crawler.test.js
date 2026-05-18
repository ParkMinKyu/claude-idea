import { describe, it, expect } from "vitest";
import { normalizeUrl, isSameOrigin, extractLinks, classifyStatus, checkLink, crawl } from "../src/crawler.js";

describe("normalizeUrl", () => {
  it("resolves relative URLs", () => {
    expect(normalizeUrl("/about", "https://example.com/")).toBe("https://example.com/about");
  });
  it("strips trailing slash and hash", () => {
    expect(normalizeUrl("https://x.com/path/#frag", "https://x.com/")).toBe("https://x.com/path");
  });
  it("returns null when no base and relative input", () => {
    expect(normalizeUrl("/relative", undefined)).toBeNull();
  });
});

describe("isSameOrigin", () => {
  it("true for same origin", () => {
    expect(isSameOrigin("https://x.com/a", "https://x.com/")).toBe(true);
  });
  it("false for different host", () => {
    expect(isSameOrigin("https://y.com/a", "https://x.com/")).toBe(false);
  });
});

describe("extractLinks", () => {
  const base = "https://example.com/";
  it("extracts unique hrefs", () => {
    const html = `<a href="/a">A</a><a href="/a">dup</a><a href="https://other.com">x</a>`;
    expect(extractLinks(html, base).sort()).toEqual([
      "https://example.com/a",
      "https://other.com/",
    ]);
  });
  it("skips mailto/tel/javascript", () => {
    const html = `<a href="mailto:a@b">m</a><a href="tel:1">t</a><a href="javascript:void(0)">j</a>`;
    expect(extractLinks(html, base)).toEqual([]);
  });
});

describe("classifyStatus", () => {
  it("maps codes", () => {
    expect(classifyStatus(200)).toBe("ok");
    expect(classifyStatus(301)).toBe("redirect");
    expect(classifyStatus(404)).toBe("broken");
    expect(classifyStatus(403)).toBe("client_error");
    expect(classifyStatus(502)).toBe("server_error");
    expect(classifyStatus(0)).toBe("error");
  });
});

describe("checkLink", () => {
  it("falls back to GET on 405", async () => {
    let calls = 0;
    const fetchMock = async (_url, opts) => {
      calls++;
      if (opts.method === "HEAD") return { status: 405 };
      return { status: 200 };
    };
    const out = await checkLink("https://x", fetchMock);
    expect(out.status).toBe(200);
    expect(calls).toBe(2);
  });
});

describe("crawl", () => {
  it("walks linked pages within max", async () => {
    const pages = {
      "https://x.com/": { status: 200, text: async () => '<a href="/a">A</a><a href="/b">B</a>' },
      "https://x.com/a": { status: 200, text: async () => '<a href="/c">C</a>' },
      "https://x.com/b": { status: 404, text: async () => "" },
      "https://x.com/c": { status: 200, text: async () => "" },
    };
    const out = await crawl({
      seed: "https://x.com/",
      maxPages: 10,
      fetchImpl: async (u) => pages[u] ?? { status: 404, text: async () => "" },
    });
    const map = Object.fromEntries(out.map((r) => [r.url, r.classification]));
    expect(map["https://x.com/"]).toBe("ok");
    expect(map["https://x.com/b"]).toBe("broken");
    expect(map["https://x.com/c"]).toBe("ok");
  });
});
