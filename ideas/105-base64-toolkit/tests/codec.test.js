import { describe, it, expect } from "vitest";
import { encode, decode, detectFormat, convert } from "../src/codec.js";

describe("encode/decode round trips", () => {
  const samples = ["hello", "한글 テスト 🚀", "a+b/c=d", ""];
  for (const fmt of ["base64", "base64url", "hex", "url"]) {
    it(`round-trips ${fmt}`, () => {
      for (const s of samples) {
        expect(decode(fmt, encode(fmt, s))).toBe(s);
      }
    });
  }
});

describe("encode produces known values", () => {
  it("base64 of 'hello'", () => {
    expect(encode("base64", "hello")).toBe("aGVsbG8=");
  });
  it("hex of 'AB'", () => {
    expect(encode("hex", "AB")).toBe("4142");
  });
  it("base64url avoids + and /", () => {
    const out = encode("base64url", "\xfb\xff");
    expect(out).not.toMatch(/[+/]/);
  });
});

describe("decode validation", () => {
  it("rejects invalid hex", () => {
    expect(() => decode("hex", "xyz")).toThrow();
    expect(() => decode("hex", "abc")).toThrow(); // odd length
  });
  it("rejects invalid base64 characters", () => {
    expect(() => decode("base64", "not valid!!")).toThrow();
  });
});

describe("detectFormat", () => {
  it("identifies common formats", () => {
    expect(detectFormat("4142")).toBe("hex");
    expect(detectFormat("hello%20world")).toBe("url");
    expect(detectFormat("aGVsbG8=")).toBe("base64");
    expect(detectFormat("aGVsbG8_-")).toBe("base64url");
    expect(detectFormat("")).toBe("empty");
  });
});

describe("convert", () => {
  it("converts base64 to hex via plaintext", () => {
    expect(convert("base64", "hex", "aGVsbG8=")).toBe(encode("hex", "hello"));
  });
});
