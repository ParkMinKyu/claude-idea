import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, report, byteSize } from "../src/lint.js";

const good = `<!DOCTYPE html><html><head><style>.x{color:red}</style></head>
<body><table><tr><td><img src="a.png" alt="logo" width="200"></td></tr></table></body></html>`;

function ruleSet(findings) {
  return new Set(findings.map((f) => f.rule));
}

test("clean table-based email passes", () => {
  const r = report(good);
  assert.equal(r.passed, true);
  assert.equal(r.counts.error, 0);
});

test("flexbox triggers an error (Outlook)", () => {
  const html = `<div style="display:flex">x</div>`;
  const findings = lint(html);
  assert.ok(ruleSet(findings).has("no-flexbox-grid"));
  assert.equal(findings.find((f) => f.rule === "no-flexbox-grid").severity, "error");
});

test("script and video are errors", () => {
  const findings = lint(`<script>alert(1)</script><video src="v.mp4"></video>`);
  const rules = ruleSet(findings);
  assert.ok(rules.has("no-script"));
  assert.ok(rules.has("no-video-tag"));
});

test("external stylesheet flagged", () => {
  const findings = lint(`<link rel="stylesheet" href="x.css">`);
  assert.ok(ruleSet(findings).has("no-external-stylesheet"));
});

test("img without alt warns, with alt does not", () => {
  assert.ok(ruleSet(lint(`<img src="a.png" width="10">`)).has("img-needs-alt"));
  assert.ok(!ruleSet(lint(`<img src="a.png" alt="x" width="10">`)).has("img-needs-alt"));
});

test("style in body is a warning but head style is fine", () => {
  assert.ok(ruleSet(lint(`<body><style>.a{}</style></body>`)).has("no-style-in-body"));
  assert.ok(!ruleSet(lint(`<head><style>.a{}</style></head><body></body>`)).has("no-style-in-body"));
});

test("gmail clipping warning for large emails", () => {
  const big = "<p>" + "a".repeat(110 * 1024) + "</p>";
  const findings = lint(big);
  assert.ok(ruleSet(findings).has("gmail-clipping"));
});

test("byteSize counts utf8 bytes", () => {
  assert.equal(byteSize("abc"), 3);
  assert.ok(byteSize("한글") > 2); // multibyte
});

test("lint rejects non-string", () => {
  assert.throws(() => lint(42), TypeError);
});

test("report aggregates counts and size", () => {
  const r = report(`<script>x</script><div style="display:grid"></div>`);
  assert.equal(r.passed, false);
  assert.ok(r.counts.error >= 2);
  assert.ok(typeof r.sizeKb === "number");
});
