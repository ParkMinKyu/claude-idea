import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  grade,
  checkContrast,
} from "../src/contrast.js";

test("parseColor handles #rgb, #rrggbb, rgb()", () => {
  assert.deepEqual(parseColor("#fff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseColor("#000000"), { r: 0, g: 0, b: 0 });
  assert.deepEqual(parseColor("rgb(18, 52, 86)"), { r: 18, g: 52, b: 86 });
});

test("parseColor rejects garbage", () => {
  assert.throws(() => parseColor("not-a-color"));
  assert.throws(() => parseColor("rgb(300,0,0)"));
});

test("relative luminance extremes", () => {
  assert.equal(relativeLuminance({ r: 255, g: 255, b: 255 }), 1);
  assert.equal(relativeLuminance({ r: 0, g: 0, b: 0 }), 0);
});

test("black-on-white is max 21:1", () => {
  assert.equal(contrastRatio("#000", "#fff"), 21);
});

test("same color is 1:1", () => {
  assert.equal(contrastRatio("#888", "#888"), 1);
});

test("known mid-gray on white ~ documented value", () => {
  // #767676 on white is the classic minimal-AA gray (~4.54).
  const r = contrastRatio("#767676", "#ffffff");
  assert.ok(r >= 4.5 && r < 4.6, `got ${r}`);
});

test("grade thresholds normal vs large", () => {
  assert.equal(grade(4.5).level, "AA");
  assert.equal(grade(7.0).level, "AAA");
  assert.equal(grade(3.0).level, "fail");
  assert.equal(grade(3.0, { large: true }).level, "AA");
});

test("checkContrast returns both contexts", () => {
  const out = checkContrast("#000", "#fff");
  assert.equal(out.ratio, 21);
  assert.equal(out.normal.AAA, true);
  assert.equal(out.large.AAA, true);
});
