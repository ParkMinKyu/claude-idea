import { describe, it, expect } from "vitest";
import {
  uuidV4,
  uuidV7,
  ulid,
  inspectUuid,
  inspectUlid,
} from "../src/index.js";
import { run } from "../src/cli.js";

describe("uuidV4", () => {
  it("generates valid v4 UUIDs with correct version/variant nibbles", () => {
    for (let i = 0; i < 50; i++) {
      const id = uuidV4();
      const info = inspectUuid(id);
      expect(info.valid).toBe(true);
      expect(info.version).toBe(4);
    }
  });

  it("produces unique values", () => {
    const set = new Set(Array.from({ length: 1000 }, () => uuidV4()));
    expect(set.size).toBe(1000);
  });
});

describe("uuidV7", () => {
  it("embeds the timestamp and is recoverable", () => {
    const now = 1_700_000_000_000;
    const id = uuidV7(now);
    const info = inspectUuid(id);
    expect(info.version).toBe(7);
    expect(info.timestampMs).toBe(now);
  });
});

describe("inspectUuid", () => {
  it("rejects non-UUID strings", () => {
    expect(inspectUuid("hello").valid).toBe(false);
    expect(inspectUuid("12345678-1234-9234-c234-123456789012").valid).toBe(false); // bad variant
  });
});

describe("ulid", () => {
  it("generates 26-char ULIDs with decodable timestamps", () => {
    const now = 1_700_000_000_000;
    const id = ulid(now);
    expect(id).toHaveLength(26);
    const info = inspectUlid(id);
    expect(info.valid).toBe(true);
    expect(info.timestampMs).toBe(now);
  });

  it("rejects malformed ULIDs", () => {
    expect(inspectUlid("short").valid).toBe(false);
  });
});

describe("cli", () => {
  it("gen -n 3 returns 3 lines", () => {
    const out = run(["gen", "v4", "-n", "3"]);
    expect(out.split("\n")).toHaveLength(3);
  });

  it("inspect routes UUID vs ULID correctly", () => {
    const u = run(["inspect", uuidV4()]);
    expect(JSON.parse(u).version).toBe(4);
    const l = run(["inspect", ulid()]);
    expect(JSON.parse(l).valid).toBe(true);
  });
});
