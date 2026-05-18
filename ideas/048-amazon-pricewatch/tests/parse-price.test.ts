import { describe, it, expect } from "vitest";
import {
  extractAsin,
  parsePriceFromHtml,
  parsePriceString,
} from "../src/lib/parse-price";

describe("parsePriceString", () => {
  it("parses USD", () => {
    expect(parsePriceString("$19.99")).toEqual({ amount: 19.99, currency: "USD" });
  });
  it("parses USD with commas", () => {
    expect(parsePriceString("$1,299.00")).toEqual({ amount: 1299, currency: "USD" });
  });
  it("parses JPY symbol", () => {
    expect(parsePriceString("￥1,580")).toEqual({ amount: 1580, currency: "JPY" });
  });
  it("parses EUR", () => {
    expect(parsePriceString("€29,99")?.currency).toBe("EUR");
  });
  it("returns null for empty", () => {
    expect(parsePriceString("free")).toBeNull();
  });
});

describe("extractAsin", () => {
  it("extracts from /dp/ url", () => {
    expect(extractAsin("https://www.amazon.com/Foo/dp/B0ABCDEFGH/ref=x")).toBe(
      "B0ABCDEFGH"
    );
  });
  it("extracts from /gp/product/", () => {
    expect(extractAsin("https://www.amazon.com/gp/product/B0ABCDEFGH")).toBe(
      "B0ABCDEFGH"
    );
  });
  it("returns null otherwise", () => {
    expect(extractAsin("https://www.amazon.com/")).toBeNull();
  });
});

describe("parsePriceFromHtml", () => {
  it("parses .a-offscreen", () => {
    const html = `<div class="a-price"><span class="a-offscreen">$24.99</span></div>`;
    expect(parsePriceFromHtml(html)).toEqual({ amount: 24.99, currency: "USD" });
  });
  it("parses #priceblock_ourprice", () => {
    const html = `<span id="priceblock_ourprice">$5.00</span>`;
    expect(parsePriceFromHtml(html)).toEqual({ amount: 5, currency: "USD" });
  });
  it("returns null if no match", () => {
    expect(parsePriceFromHtml("<html></html>")).toBeNull();
  });
});
