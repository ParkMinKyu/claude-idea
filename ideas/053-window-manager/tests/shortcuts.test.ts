import { describe, it, expect } from "vitest";
import { DEFAULT_SHORTCUTS, isValidAccelerator, mergeShortcuts } from "../src/main/shortcuts";

describe("isValidAccelerator", () => {
  it("accepts modifier + key", () => {
    expect(isValidAccelerator("CommandOrControl+Alt+Left")).toBe(true);
    expect(isValidAccelerator("Ctrl+Shift+A")).toBe(true);
    expect(isValidAccelerator("Cmd+F1")).toBe(true);
  });
  it("rejects without modifier", () => {
    expect(isValidAccelerator("A")).toBe(false);
  });
  it("rejects unknown modifier", () => {
    expect(isValidAccelerator("Foo+A")).toBe(false);
  });
  it("rejects invalid key", () => {
    expect(isValidAccelerator("Ctrl+F13")).toBe(false);
  });
});

describe("DEFAULT_SHORTCUTS", () => {
  it("all are valid", () => {
    for (const k of Object.keys(DEFAULT_SHORTCUTS)) {
      expect(isValidAccelerator(k)).toBe(true);
    }
  });
});

describe("mergeShortcuts", () => {
  it("user overrides default", () => {
    const out = mergeShortcuts(DEFAULT_SHORTCUTS, {
      "CommandOrControl+Alt+Left": "right-half",
    });
    expect(out["CommandOrControl+Alt+Left"]).toBe("right-half");
  });
  it("invalid user shortcuts are ignored", () => {
    const out = mergeShortcuts(DEFAULT_SHORTCUTS, { Q: "right-half" });
    expect(out["Q"]).toBeUndefined();
  });
});
