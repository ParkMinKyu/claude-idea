import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseDiff,
  aggregate,
  decideLabel,
  labelDiff,
  DEFAULT_THRESHOLDS,
} from "../src/labeler.js";

const DIFF = `diff --git a/src/a.js b/src/a.js
index 111..222 100644
--- a/src/a.js
+++ b/src/a.js
@@ -1,2 +1,3 @@
 keep
-old line
+new line
+another new
diff --git a/package-lock.json b/package-lock.json
index 333..444 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,1 +1,5 @@
+lock1
+lock2
+lock3
+lock4
`;

test("parseDiff counts additions/deletions per file", () => {
  const files = parseDiff(DIFF);
  assert.equal(files.length, 2);
  const a = files.find((f) => f.file === "src/a.js");
  assert.equal(a.additions, 2);
  assert.equal(a.deletions, 1);
  const lock = files.find((f) => f.file === "package-lock.json");
  assert.equal(lock.additions, 4);
  assert.equal(lock.deletions, 0);
});

test("parseDiff ignores +++/--- headers", () => {
  const files = parseDiff(DIFF);
  // src/a.js real content adds = 2 (not 3, the +++ header excluded)
  assert.equal(files.find((f) => f.file === "src/a.js").additions, 2);
});

test("parseDiff handles renames", () => {
  const d = `diff --git a/old.js b/new.js
similarity index 90%
rename from old.js
rename to new.js
--- a/old.js
+++ b/new.js
@@ -1 +1 @@
-x
+y
`;
  const files = parseDiff(d);
  assert.equal(files[0].file, "new.js");
  assert.equal(files[0].additions, 1);
  assert.equal(files[0].deletions, 1);
});

test("aggregate excludes lockfiles from effective total", () => {
  const stats = aggregate(parseDiff(DIFF));
  assert.equal(stats.total, 7); // 3 + 4
  assert.equal(stats.effective, 3); // lockfile's 4 excluded
  assert.equal(stats.ignored, 4);
});

test("decideLabel maps buckets", () => {
  assert.equal(decideLabel(5), "size/XS");
  assert.equal(decideLabel(30), "size/S");
  assert.equal(decideLabel(150), "size/M");
  assert.equal(decideLabel(400), "size/L");
  assert.equal(decideLabel(800), "size/XL");
  assert.equal(decideLabel(5000), "size/XXL");
});

test("decideLabel respects custom thresholds", () => {
  const custom = [
    { label: "tiny", max: 10 },
    { label: "huge", max: Infinity },
  ];
  assert.equal(decideLabel(5, custom), "tiny");
  assert.equal(decideLabel(50, custom), "huge");
});

test("labelDiff returns label based on effective size", () => {
  const r = labelDiff(DIFF);
  assert.equal(r.label, "size/XS"); // only 3 effective lines
  assert.equal(r.stats.effective, 3);
  assert.equal(r.needsReviewSplit, false);
});

test("labelDiff flags very large PRs", () => {
  const big =
    "diff --git a/big.js b/big.js\n--- a/big.js\n+++ b/big.js\n" +
    Array.from({ length: 600 }, (_, i) => `+line ${i}`).join("\n");
  const r = labelDiff(big);
  assert.equal(r.needsReviewSplit, true);
  assert.equal(r.label, "size/XL");
});

test("DEFAULT_THRESHOLDS cover XS..XXL", () => {
  assert.deepEqual(
    DEFAULT_THRESHOLDS.map((t) => t.label),
    ["size/XS", "size/S", "size/M", "size/L", "size/XL", "size/XXL"]
  );
});
