import { describe, it, expect } from "vitest";
import {
  transitionIncident,
  worstStatus,
  uptimePercent,
  dailyHeatmap,
  serializeSse,
} from "../src/status.js";

describe("transitionIncident", () => {
  it("allows valid transition", () => {
    const start = { id: "1", status: "investigating" };
    const next = transitionIncident(start, "identified");
    expect(next.status).toBe("identified");
  });
  it("sets resolvedAt on resolve", () => {
    const next = transitionIncident({ id: "1", status: "monitoring" }, "resolved");
    expect(next.resolvedAt).toBeTruthy();
  });
  it("rejects illegal transition", () => {
    expect(() => transitionIncident({ status: "resolved" }, "investigating")).toThrow();
  });
});

describe("worstStatus", () => {
  it("returns worst component severity", () => {
    expect(worstStatus(["operational", "degraded", "major_outage"])).toBe("major_outage");
  });
  it("operational when all good", () => {
    expect(worstStatus(["operational", "operational"])).toBe("operational");
  });
});

describe("uptimePercent", () => {
  const now = Date.parse("2026-05-18T00:00:00Z");
  it("ignores checks outside window", () => {
    const checks = [
      { at: new Date(now - 200 * 86_400_000).toISOString(), up: false },
      { at: new Date(now - 1 * 86_400_000).toISOString(), up: true },
    ];
    expect(uptimePercent(checks, 90, now)).toBe(100);
  });
  it("computes percent within window", () => {
    const checks = Array.from({ length: 100 }, (_, i) => ({
      at: new Date(now - 86_400_000).toISOString(),
      up: i < 99,
    }));
    expect(uptimePercent(checks, 90, now)).toBe(99);
  });
});

describe("dailyHeatmap", () => {
  it("produces N buckets", () => {
    const now = Date.parse("2026-05-18T00:00:00Z");
    const buckets = dailyHeatmap([], 7, now);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].day < buckets[6].day).toBe(true);
  });
  it("returns null uptime for empty days", () => {
    const buckets = dailyHeatmap([], 3, Date.parse("2026-05-18T00:00:00Z"));
    expect(buckets.every((b) => b.uptime === null)).toBe(true);
  });
});

describe("serializeSse", () => {
  it("encodes event and data lines", () => {
    const out = serializeSse("update", { id: 1 });
    expect(out).toBe('event: update\ndata: {"id":1}\n\n');
  });
});
