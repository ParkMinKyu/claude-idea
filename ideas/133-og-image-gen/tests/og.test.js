import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeXml,
  parseParams,
  wrapText,
  renderSvg,
  generate,
  DEFAULTS,
} from "../src/og.js";
import { handle } from "../src/server.js";

test("escapeXml neutralizes injection", () => {
  assert.equal(escapeXml('<script>"&\''), "&lt;script&gt;&quot;&amp;&apos;");
});

test("parseParams applies defaults", () => {
  const cfg = parseParams({});
  assert.equal(cfg.width, DEFAULTS.width);
  assert.equal(cfg.template, "basic");
});

test("parseParams normalizes color without #", () => {
  assert.equal(parseParams({ bg: "112233" }).bg, "#112233");
});

test("parseParams rejects bad color and out-of-range size", () => {
  assert.throws(() => parseParams({ fg: "zzz" }), SyntaxError);
  assert.throws(() => parseParams({ width: 100 }), RangeError);
  assert.throws(() => parseParams({ template: "fancy" }), SyntaxError);
});

test("parseParams clamps title length", () => {
  const long = "x".repeat(300);
  assert.equal(parseParams({ title: long }).title.length, 140);
});

test("wrapText splits and caps lines", () => {
  const lines = wrapText("one two three four five six", 8, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes("…"), "should mark truncation");
});

test("renderSvg produces valid-ish svg containing escaped title", () => {
  const svg = renderSvg(parseParams({ title: "Hello <World>" }));
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("Hello &lt;World&gt;"));
  assert.ok(!svg.includes("<World>"), "raw markup must not leak");
});

test("generate is params->svg shortcut", () => {
  const svg = generate({ title: "Hi", subtitle: "sub" });
  assert.ok(svg.includes(">Hi<") || svg.includes("Hi"));
  assert.ok(svg.includes("sub"));
});

test("server handle returns svg content type", () => {
  const out = handle("/og?title=Test&bg=000000");
  assert.equal(out.status, 200);
  assert.equal(out.contentType, "image/svg+xml");
  assert.ok(out.body.includes("Test"));
  assert.ok(out.body.includes("#000000"));
});
