import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCommit, lintCommit, DEFAULT_TYPES } from "../src/lint.js";

test("parseCommit extracts type/scope/subject", () => {
  const p = parseCommit("feat(api): add pagination");
  assert.equal(p.valid, true);
  assert.equal(p.type, "feat");
  assert.equal(p.scope, "api");
  assert.equal(p.subject, "add pagination");
  assert.equal(p.breaking, false);
});

test("parseCommit detects breaking via !", () => {
  const p = parseCommit("feat!: drop node 16");
  assert.equal(p.breaking, true);
  assert.equal(p.type, "feat");
});

test("parseCommit detects BREAKING CHANGE footer", () => {
  const p = parseCommit("fix: x\n\nbody here\n\nBREAKING CHANGE: api removed");
  assert.equal(p.breaking, true);
  assert.equal(p.body, "body here");
  assert.ok(p.footers.some((f) => f.key === "BREAKING CHANGE"));
});

test("lintCommit accepts a valid message", () => {
  const r = lintCommit("fix(parser): handle empty input");
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, []);
});

test("lintCommit rejects malformed header", () => {
  const r = lintCommit("updated some stuff");
  assert.equal(r.valid, false);
  assert.ok(r.errors[0].includes("헤더 형식"));
});

test("lintCommit rejects unknown type", () => {
  const r = lintCommit("wibble: do thing");
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("알 수 없는 타입")));
});

test("lintCommit enforces header length", () => {
  const long = "feat: " + "x".repeat(100);
  const r = lintCommit(long, { maxHeaderLength: 50 });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.includes("초과")));
});

test("lintCommit requireScope option", () => {
  assert.equal(lintCommit("feat: add thing", { requireScope: true }).valid, false);
  assert.equal(lintCommit("feat(core): add thing", { requireScope: true }).valid, true);
});

test("lintCommit warns on trailing period and capital subject", () => {
  const r = lintCommit("feat: Add thing.", { subjectCase: "lower" });
  assert.equal(r.valid, true); // warnings don't fail
  assert.ok(r.warnings.some((w) => w.includes("마침표")));
  assert.ok(r.warnings.some((w) => w.includes("소문자")));
});

test("lintCommit skips merge commits", () => {
  const r = lintCommit("Merge branch 'main' into dev");
  assert.equal(r.valid, true);
  assert.equal(r.skipped, "merge-commit");
});

test("DEFAULT_TYPES includes conventional set", () => {
  for (const t of ["feat", "fix", "chore", "docs"]) assert.ok(DEFAULT_TYPES.includes(t));
});
