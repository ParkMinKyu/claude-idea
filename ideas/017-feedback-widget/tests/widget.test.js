// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createWidget, validatePayload } from "../src/widget.js";

describe("validatePayload", () => {
  it("accepts valid payload", () => {
    expect(validatePayload({ rating: 5, message: "great" })).toBeNull();
  });
  it("rejects bad rating", () => {
    expect(validatePayload({ rating: 0, message: "x" })).toMatch(/rating/);
    expect(validatePayload({ rating: 6, message: "x" })).toMatch(/rating/);
  });
  it("rejects missing message", () => {
    expect(validatePayload({ rating: 3, message: "" })).toMatch(/message/);
  });
});

describe("createWidget", () => {
  it("requires apiKey", () => {
    expect(() => createWidget({})).toThrow(/apiKey/);
  });

  it("mounts button to document body", () => {
    const w = createWidget({ apiKey: "pk_test" });
    expect(document.querySelector("[data-fb-widget]")).toBeTruthy();
    w.destroy();
  });

  it("submits payload via fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = fetchMock;
    const w = createWidget({ apiKey: "pk_test" });
    const root = document.querySelector("[data-fb-widget]").shadowRoot;
    const form = root.querySelector("form");
    form.querySelector("[name=rating]").value = "5";
    form.querySelector("[name=message]").value = "love it";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.rating).toBe(5);
    expect(body.message).toBe("love it");
    w.destroy();
  });
});
