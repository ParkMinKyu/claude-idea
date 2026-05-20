import { describe, it, expect } from "vitest";
import { parsePlan, classifyAction } from "../src/parser.js";
import { monthlyCost, HOURS_PER_MONTH } from "../src/pricing.js";
import { estimatePlan, exceedsThreshold } from "../src/estimate.js";
import { toMarkdown } from "../src/report.js";
import { PLAN } from "./fixtures.js";

describe("parsePlan / classifyAction", () => {
  it("extracts all resource changes", () => {
    const changes = parsePlan(PLAN);
    expect(changes.length).toBe(5);
    expect(changes[0].type).toBe("aws_instance");
  });
  it("classifies create+delete as replace", () => {
    expect(classifyAction(["create", "delete"])).toBe("replace");
    expect(classifyAction(["update"])).toBe("update");
    expect(classifyAction(["no-op"])).toBe("no-op");
  });
});

describe("monthlyCost", () => {
  it("computes EC2 monthly from hourly", () => {
    const r = monthlyCost("aws_instance", { instance_type: "m5.large" });
    expect(r.supported).toBe(true);
    expect(r.monthly).toBeCloseTo(0.096 * HOURS_PER_MONTH, 5);
  });
  it("marks unsupported resources", () => {
    expect(monthlyCost("aws_s3_bucket", {}).supported).toBe(false);
    expect(monthlyCost("aws_instance", { instance_type: "x9.huge" }).supported).toBe(false);
  });
  it("doubles RDS compute for multi_az and adds storage", () => {
    const r = monthlyCost("aws_db_instance", { instance_class: "db.t3.medium", allocated_storage: 100, multi_az: true });
    expect(r.monthly).toBeCloseTo(0.068 * HOURS_PER_MONTH * 2 + 100 * 0.08, 4);
  });
});

describe("estimatePlan", () => {
  it("skips no-op and computes delta from totals", () => {
    const est = estimatePlan(PLAN);
    // 5 changes minus 1 no-op = 4 items.
    expect(est.items.length).toBe(4);
    expect(typeof est.delta).toBe("number");
    expect(est.delta).toBeCloseTo(est.totalAfter - est.totalBefore, 2);
  });

  it("flags an EC2 upgrade as a cost increase", () => {
    const est = estimatePlan(PLAN);
    const web = est.items.find((i) => i.address === "aws_instance.web");
    expect(web.action).toBe("update");
    expect(web.delta).toBeGreaterThan(0);
  });

  it("threshold gate triggers when delta exceeds limit", () => {
    const est = estimatePlan(PLAN);
    expect(exceedsThreshold(est, 0)).toBe(true);
    expect(exceedsThreshold(est, 1e9)).toBe(false);
  });
});

describe("toMarkdown", () => {
  it("renders a table with a totals row", () => {
    const md = toMarkdown(estimatePlan(PLAN));
    expect(md).toContain("| 리소스 |");
    expect(md).toContain("**합계**");
  });
});
