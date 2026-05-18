// Invoice domain: line totals, taxes/discounts, currency rounding, invoice number, status machine.

const ZERO_DECIMAL = new Set(["KRW", "JPY", "VND"]);

function round(amount, currency) {
  if (ZERO_DECIMAL.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

export function lineTotal(line) {
  const qty = Number(line.quantity ?? 0);
  const price = Number(line.unitPrice ?? 0);
  if (qty < 0 || price < 0) throw new Error("quantity and price must be non-negative");
  return qty * price;
}

export function summarize(invoice) {
  const currency = invoice.currency ?? "KRW";
  const subtotal = (invoice.lines ?? []).reduce((s, l) => s + lineTotal(l), 0);
  const discountAmount = invoice.discount
    ? invoice.discount.type === "percent"
      ? subtotal * (invoice.discount.value / 100)
      : Math.min(invoice.discount.value, subtotal)
    : 0;
  const taxable = subtotal - discountAmount;
  const taxRate = invoice.taxRate ?? 0;
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;
  return {
    currency,
    subtotal: round(subtotal, currency),
    discount: round(discountAmount, currency),
    tax: round(tax, currency),
    total: round(total, currency),
  };
}

// Invoice number format: INV-YYYY-XXXX
export function nextInvoiceNumber(previousNumbers, year = new Date().getFullYear()) {
  const prefix = `INV-${year}-`;
  let max = 0;
  for (const n of previousNumbers ?? []) {
    if (typeof n === "string" && n.startsWith(prefix)) {
      const seq = Number(n.slice(prefix.length));
      if (Number.isFinite(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

// Status: draft → sent → paid (or overdue → paid). late = past dueDate, not paid.
export function statusFor(invoice, now = new Date()) {
  if (invoice.paidAt) return "paid";
  if (!invoice.sentAt) return "draft";
  if (invoice.dueDate && new Date(invoice.dueDate) < now) return "overdue";
  return "sent";
}

export function shouldRemind(invoice, now = new Date()) {
  if (statusFor(invoice, now) !== "overdue") return false;
  const lastReminderAt = invoice.lastReminderAt ? new Date(invoice.lastReminderAt) : new Date(invoice.dueDate);
  const daysSince = (now - lastReminderAt) / 86_400_000;
  return daysSince >= 3;
}
