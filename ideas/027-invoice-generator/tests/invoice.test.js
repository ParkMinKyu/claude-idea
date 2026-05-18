import { describe, it, expect } from "vitest";
import { lineTotal, summarize, nextInvoiceNumber, statusFor, shouldRemind } from "../src/invoice.js";

describe("lineTotal", () => {
  it("multiplies qty * price", () => {
    expect(lineTotal({ quantity: 3, unitPrice: 100 })).toBe(300);
  });
  it("rejects negative", () => {
    expect(() => lineTotal({ quantity: -1, unitPrice: 10 })).toThrow();
  });
});

describe("summarize", () => {
  it("computes subtotal/tax/total in KRW (integer)", () => {
    const out = summarize({
      currency: "KRW",
      lines: [
        { quantity: 2, unitPrice: 500_000 },
        { quantity: 1, unitPrice: 250_000 },
      ],
      taxRate: 10,
    });
    expect(out.subtotal).toBe(1_250_000);
    expect(out.tax).toBe(125_000);
    expect(out.total).toBe(1_375_000);
  });
  it("applies percent discount", () => {
    const out = summarize({
      currency: "USD",
      lines: [{ quantity: 1, unitPrice: 100 }],
      discount: { type: "percent", value: 10 },
      taxRate: 0,
    });
    expect(out.discount).toBe(10);
    expect(out.total).toBe(90);
  });
  it("caps fixed discount at subtotal", () => {
    const out = summarize({
      currency: "KRW",
      lines: [{ quantity: 1, unitPrice: 50_000 }],
      discount: { type: "fixed", value: 80_000 },
    });
    expect(out.discount).toBe(50_000);
    expect(out.total).toBe(0);
  });
});

describe("nextInvoiceNumber", () => {
  it("starts at 0001 when empty", () => {
    expect(nextInvoiceNumber([], 2026)).toBe("INV-2026-0001");
  });
  it("increments max sequence for year", () => {
    expect(nextInvoiceNumber(["INV-2026-0001", "INV-2026-0005", "INV-2025-0099"], 2026)).toBe("INV-2026-0006");
  });
});

describe("statusFor", () => {
  it("draft when not sent", () => {
    expect(statusFor({})).toBe("draft");
  });
  it("paid when paidAt set", () => {
    expect(statusFor({ paidAt: "2026-01-01" })).toBe("paid");
  });
  it("overdue when past due and not paid", () => {
    const inv = { sentAt: "2026-04-01", dueDate: "2026-04-15" };
    expect(statusFor(inv, new Date("2026-05-18"))).toBe("overdue");
  });
});

describe("shouldRemind", () => {
  it("true once 3 days past due with no reminder", () => {
    const inv = { sentAt: "2026-04-01", dueDate: "2026-05-10" };
    expect(shouldRemind(inv, new Date("2026-05-18"))).toBe(true);
  });
  it("false if reminded recently", () => {
    const inv = { sentAt: "2026-04-01", dueDate: "2026-05-10", lastReminderAt: "2026-05-17" };
    expect(shouldRemind(inv, new Date("2026-05-18"))).toBe(false);
  });
});
