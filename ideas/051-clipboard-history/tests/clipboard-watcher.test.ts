import { describe, it, expect } from "vitest";
import { ClipboardWatcher, hash, isLikelySecret } from "../src/main/clipboard-watcher";

class FakeClip {
  text = "";
  setText(t: string) {
    this.text = t;
  }
  readText() {
    return this.text;
  }
  readImage() {
    return { isEmpty: () => true, toDataURL: () => "" };
  }
}

describe("hash", () => {
  it("stable", () => {
    expect(hash("abc")).toBe(hash("abc"));
    expect(hash("abc")).not.toBe(hash("abcd"));
  });
});

describe("ClipboardWatcher", () => {
  it("emits new text items only on change", () => {
    const fake = new FakeClip();
    const w = new ClipboardWatcher(fake, 9999);
    const items: string[] = [];
    w.on("item", (i) => items.push(i.content));

    fake.setText("first");
    w.poll();
    fake.setText("first");
    w.poll();
    fake.setText("second");
    w.poll();
    expect(items).toEqual(["first", "second"]);
  });
  it("ignores empty", () => {
    const fake = new FakeClip();
    const w = new ClipboardWatcher(fake, 9999);
    let n = 0;
    w.on("item", () => n++);
    w.poll();
    expect(n).toBe(0);
  });
});

describe("isLikelySecret", () => {
  it("detects password-like", () => {
    expect(isLikelySecret("h3ll0W0rld!ABC")).toBe(true);
  });
  it("detects AWS key", () => {
    expect(isLikelySecret("AKIA1234567890ABCDEF")).toBe(true);
  });
  it("ignores normal text", () => {
    expect(isLikelySecret("hello world this is normal text")).toBe(false);
  });
});
