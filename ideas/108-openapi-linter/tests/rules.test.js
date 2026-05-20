import { describe, it, expect } from "vitest";
import { lint, summarize, RULES } from "../src/rules.js";
import { lintFile } from "../src/cli.js";

const goodSpec = {
  openapi: "3.0.3",
  info: { title: "API", version: "1.0.0", contact: { email: "a@b.com" } },
  paths: {
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { "200": { description: "ok" } },
      },
    },
  },
};

describe("lint on a valid spec", () => {
  it("reports no issues", () => {
    const issues = lint(goodSpec);
    expect(issues).toHaveLength(0);
    expect(summarize(issues).ok).toBe(true);
  });
});

describe("lint detects errors", () => {
  it("flags missing operationId and missing 2xx", () => {
    const spec = {
      openapi: "3.0.3",
      info: { title: "x", version: "1", contact: {} },
      paths: { "/a": { get: { responses: { "404": {} } } } },
    };
    const ids = lint(spec).map((i) => i.ruleId);
    expect(ids).toContain("operation-operationId");
    expect(ids).toContain("operation-success-response");
  });

  it("flags undeclared path parameters", () => {
    const spec = {
      openapi: "3.0.3",
      info: { title: "x", version: "1", contact: {} },
      paths: {
        "/items/{itemId}": {
          get: { operationId: "g", responses: { "200": {} } },
        },
      },
    };
    const issues = lint(spec);
    expect(issues.some((i) => i.ruleId === "path-param-defined")).toBe(true);
  });

  it("flags duplicate operationIds", () => {
    const spec = {
      openapi: "3.0.3",
      info: { title: "x", version: "1", contact: {} },
      paths: {
        "/a": { get: { operationId: "dup", responses: { "200": {} } } },
        "/b": { get: { operationId: "dup", responses: { "200": {} } } },
      },
    };
    const dup = lint(spec).filter((i) => i.ruleId === "operation-operationId");
    expect(dup.some((i) => /duplicate/.test(i.message))).toBe(true);
  });
});

describe("rule selection", () => {
  it("only runs selected rules", () => {
    const spec = { openapi: "3.0.3", info: {}, paths: { "/a": { get: {} } } };
    const issues = lint(spec, { only: ["info-contact"] });
    expect(issues.every((i) => i.ruleId === "info-contact")).toBe(true);
  });

  it("rejects specs without openapi field", () => {
    expect(() => lint({ paths: {} })).toThrow(/openapi/);
  });
});

describe("lintFile", () => {
  it("reads and lints from an injected reader", () => {
    const reader = () => JSON.stringify(goodSpec);
    const { summary } = lintFile("ignored.json", reader);
    expect(summary.ok).toBe(true);
  });
});

describe("rule metadata", () => {
  it("every rule has id, severity, description", () => {
    for (const r of RULES) {
      expect(r.id).toBeTruthy();
      expect(["error", "warn"]).toContain(r.severity);
      expect(typeof r.check).toBe("function");
    }
  });
});
