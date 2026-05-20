import { describe, it, expect } from "vitest";
import { diffSpecs } from "../src/diff.js";
import { classifyChange, classifyAll, suggestBump } from "../src/classify.js";
import { toChangelog } from "../src/changelog.js";
import { OLD_SPEC, NEW_SPEC } from "./fixtures.js";

describe("diffSpecs", () => {
  const changes = diffSpecs(OLD_SPEC, NEW_SPEC);
  const kinds = changes.map((c) => c.kind);

  it("detects removed and added paths", () => {
    expect(changes).toContainEqual(expect.objectContaining({ kind: "path-removed", path: "/legacy" }));
    expect(changes).toContainEqual(expect.objectContaining({ kind: "path-added", path: "/reports" }));
  });

  it("detects param required change and new optional param", () => {
    expect(kinds).toContain("param-required-added");
    expect(changes).toContainEqual(expect.objectContaining({ kind: "param-added", name: "limit", required: false }));
  });

  it("detects removed and added responses", () => {
    expect(changes).toContainEqual(expect.objectContaining({ kind: "response-removed", name: "200" }));
    expect(changes).toContainEqual(expect.objectContaining({ kind: "response-added", name: "500" }));
  });
});

describe("classifyChange", () => {
  it("marks path/operation removal as breaking", () => {
    expect(classifyChange({ kind: "path-removed" })).toBe("breaking");
    expect(classifyChange({ kind: "operation-removed" })).toBe("breaking");
  });
  it("required param added is breaking, optional is non-breaking", () => {
    expect(classifyChange({ kind: "param-added", required: true })).toBe("breaking");
    expect(classifyChange({ kind: "param-added", required: false })).toBe("non-breaking");
  });
  it("removing a 2xx response is breaking; non-2xx is not", () => {
    expect(classifyChange({ kind: "response-removed", name: "200" })).toBe("breaking");
    expect(classifyChange({ kind: "response-removed", name: "404" })).toBe("non-breaking");
  });
  it("added response is info", () => {
    expect(classifyChange({ kind: "response-added", name: "500" })).toBe("info");
  });
});

describe("classifyAll + suggestBump", () => {
  it("buckets changes and suggests major when breaking present", () => {
    const result = classifyAll(diffSpecs(OLD_SPEC, NEW_SPEC));
    expect(result.hasBreaking).toBe(true);
    expect(suggestBump(result)).toBe("major");
    expect(result.buckets.breaking.length).toBeGreaterThan(0);
  });

  it("suggests minor for additive-only changes", () => {
    const additive = { paths: { "/a": OLD_SPEC.paths["/legacy"] } };
    const withNew = { paths: { "/a": OLD_SPEC.paths["/legacy"], "/b": OLD_SPEC.paths["/legacy"] } };
    const result = classifyAll(diffSpecs(additive, withNew));
    expect(result.hasBreaking).toBe(false);
    expect(suggestBump(result)).toBe("minor");
  });
});

describe("toChangelog", () => {
  it("renders sections with breaking heading", () => {
    const md = toChangelog(classifyAll(diffSpecs(OLD_SPEC, NEW_SPEC)));
    expect(md).toContain("Breaking 변경");
    expect(md).toContain("major");
  });
  it("renders no-changes message", () => {
    const md = toChangelog(classifyAll(diffSpecs(OLD_SPEC, OLD_SPEC)));
    expect(md).toContain("변경 사항 없음");
  });
});
