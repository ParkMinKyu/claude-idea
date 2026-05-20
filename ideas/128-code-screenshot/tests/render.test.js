import { describe, it, expect } from "vitest";
import { tokenize, tokenizeLine } from "../src/tokenizer.js";
import { escapeXml } from "../src/escape.js";
import { getTheme } from "../src/themes.js";
import { renderSvg } from "../src/render.js";

describe("tokenizeLine", () => {
  it("classifies keywords, strings, numbers, comments", () => {
    const types = Object.fromEntries(
      tokenizeLine(`const x = "hi" // 42`).filter((t) => t.text.trim()).map((t) => [t.text, t.type])
    );
    expect(types["const"]).toBe("keyword");
    expect(types['"hi"']).toBe("string");
    expect(types["// 42"]).toBe("comment");
  });
  it("classifies numbers and identifiers", () => {
    const toks = tokenizeLine("let n = 3.14");
    expect(toks.find((t) => t.text === "3.14").type).toBe("number");
    expect(toks.find((t) => t.text === "n").type).toBe("text");
  });
  it("handles python # comments", () => {
    const toks = tokenizeLine("x = 1  # note");
    expect(toks.find((t) => t.text === "# note").type).toBe("comment");
  });
});

describe("tokenize", () => {
  it("splits by lines", () => {
    expect(tokenize("a\nb\nc").length).toBe(3);
  });
});

describe("escapeXml", () => {
  it("escapes special characters", () => {
    expect(escapeXml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&apos;");
  });
});

describe("getTheme", () => {
  it("returns requested theme and falls back to dark", () => {
    expect(getTheme("light").bg).toBe("#ffffff");
    expect(getTheme("nope")).toBe(getTheme("dark"));
  });
});

describe("renderSvg", () => {
  const code = `function greet(name) {\n  return "hi " + name; // greeting\n}`;

  it("produces a valid svg root with correct line count", () => {
    const r = renderSvg(code);
    expect(r.lines).toBe(3);
    expect(r.svg.startsWith("<svg")).toBe(true);
    expect(r.svg.trim().endsWith("</svg>")).toBe(true);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
  });

  it("escapes code content (no raw <script>)", () => {
    const r = renderSvg(`const a = "<script>";`);
    expect(r.svg).not.toContain("<script>");
    expect(r.svg).toContain("&lt;script&gt;");
  });

  it("includes window chrome and is deterministic", () => {
    const a = renderSvg(code, { theme: "light" });
    const b = renderSvg(code, { theme: "light" });
    expect(a.svg).toBe(b.svg);
    expect(a.svg).toContain("#ff5f56"); // traffic light
  });

  it("omits line numbers when disabled", () => {
    const withNums = renderSvg("a\nb", { lineNumbers: true });
    const without = renderSvg("a\nb", { lineNumbers: false });
    expect(without.width).toBeLessThan(withNums.width);
  });
});
