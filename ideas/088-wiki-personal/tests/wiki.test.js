import { describe, it, expect } from "vitest";
import { parseLinks, renderLinks, createIndex } from "../src/wiki.js";

describe("parseLinks", () => {
  it("extracts wiki links and aliases", () => {
    const links = parseLinks("see [[Foo]] and [[Bar|baz]]");
    expect(links).toEqual([
      { title: "Foo", alias: null },
      { title: "Bar", alias: "baz" },
    ]);
  });

  it("returns empty list when no links", () => {
    expect(parseLinks("plain text")).toEqual([]);
  });
});

describe("renderLinks", () => {
  it("marks missing notes with .missing class", () => {
    const html = renderLinks("link to [[Ghost]]", (t) => t !== "Ghost");
    expect(html).toContain("wiki-link missing");
  });

  it("uses alias as display text", () => {
    const html = renderLinks("[[Foo|see foo]]");
    expect(html).toContain(">see foo</a>");
  });
});

describe("createIndex backlinks", () => {
  it("tracks incoming links", () => {
    const idx = createIndex();
    idx.upsert("Hub", "");
    idx.upsert("A", "references [[Hub]]");
    idx.upsert("B", "also [[Hub]]");
    expect(idx.backlinks("Hub").sort()).toEqual(["A", "B"]);
  });

  it("removes outdated backlinks on re-upsert", () => {
    const idx = createIndex();
    idx.upsert("Hub", "");
    idx.upsert("A", "[[Hub]]");
    idx.upsert("A", "nothing here");
    expect(idx.backlinks("Hub")).toEqual([]);
  });
});

describe("search ranking", () => {
  it("ranks title matches above body matches", () => {
    const idx = createIndex();
    idx.upsert("zettel", "general note text");
    idx.upsert("misc", "zettel appears in body");
    const results = idx.search("zettel");
    expect(results[0].title).toBe("zettel");
  });

  it("returns empty for blank query", () => {
    const idx = createIndex();
    idx.upsert("a", "b");
    expect(idx.search("   ")).toEqual([]);
  });
});
