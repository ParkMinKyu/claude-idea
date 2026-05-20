import { describe, it, expect } from "vitest";
import { parseManifests } from "../src/parser.js";
import { getContainers, runRules } from "../src/rules.js";
import { validateManifest, isPassing } from "../src/validate.js";

const GOOD = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  template:
    spec:
      containers:
        - name: web
          image: nginx:1.27.0
          resources:
            limits:
              cpu: "500m"
              memory: "256Mi"
`;

const BAD = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bad
spec:
  template:
    spec:
      hostNetwork: true
      containers:
        - name: app
          image: myapp:latest
          securityContext:
            privileged: true
`;

describe("parseManifests", () => {
  it("parses multiple documents and skips empty ones", () => {
    const { resources, errors } = parseManifests(`${GOOD}\n---\n\n---\n${BAD}`);
    expect(errors).toEqual([]);
    expect(resources.length).toBe(2);
    expect(resources[0].kind).toBe("Deployment");
  });

  it("reports parse errors for malformed yaml", () => {
    const { errors } = parseManifests("foo:\n  - a\n bad: : :");
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("getContainers", () => {
  it("extracts containers from a Deployment", () => {
    const { resources } = parseManifests(GOOD);
    expect(getContainers(resources[0]).map((c) => c.name)).toEqual(["web"]);
  });
});

describe("runRules", () => {
  it("passes a well-formed manifest with no errors", () => {
    const { resources } = parseManifests(GOOD);
    const diags = runRules(resources[0]);
    expect(diags.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("flags privileged, latest tag, missing limits, hostNetwork", () => {
    const { resources } = parseManifests(BAD);
    const rules = runRules(resources[0]).map((d) => d.rule);
    expect(rules).toContain("privileged-container");
    expect(rules).toContain("image-latest-tag");
    expect(rules).toContain("missing-resource-limits");
    expect(rules).toContain("host-network");
  });
});

describe("validateManifest", () => {
  it("scores a clean manifest as 100 and passing", () => {
    const report = validateManifest(GOOD);
    expect(report.score).toBe(100);
    expect(isPassing(report)).toBe(true);
  });

  it("scores a bad manifest below 100 and failing", () => {
    const report = validateManifest(BAD);
    expect(report.score).toBeLessThan(100);
    expect(report.summary.error).toBeGreaterThan(0);
    expect(isPassing(report)).toBe(false);
  });
});
