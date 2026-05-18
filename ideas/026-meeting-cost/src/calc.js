// Meeting cost core: salary-to-hourly conversion, live cost computation,
// shareable card payload, currency formatting.

// Approximate working hours per year (52 weeks * 40 hrs - holidays).
const HOURS_PER_YEAR = 2000;

export function hourlyRate(annualSalary) {
  if (typeof annualSalary !== "number" || annualSalary < 0) throw new Error("invalid salary");
  return annualSalary / HOURS_PER_YEAR;
}

export function meetingCost({ participants, avgSalary, durationMs }) {
  if (!Number.isInteger(participants) || participants < 0) throw new Error("invalid participants");
  if (durationMs < 0) throw new Error("duration must be >= 0");
  const hours = durationMs / 3_600_000;
  return Math.round(participants * hourlyRate(avgSalary) * hours);
}

export function liveCostAt(start, now, participants, avgSalary) {
  const startTs = start instanceof Date ? start.getTime() : Number(start);
  const nowTs = now instanceof Date ? now.getTime() : Number(now);
  return meetingCost({ participants, avgSalary, durationMs: Math.max(0, nowTs - startTs) });
}

// Currency formatting — supports KRW, USD, JPY, EUR. Used by both UI and OG card.
const FRACTION = { KRW: 0, JPY: 0, USD: 2, EUR: 2 };

export function formatCurrency(amount, currency = "KRW", locale = "ko-KR") {
  const fraction = FRACTION[currency] ?? 2;
  if (typeof Intl !== "undefined" && Intl.NumberFormat) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: fraction,
      minimumFractionDigits: fraction,
    }).format(amount);
  }
  return `${currency} ${amount.toFixed(fraction)}`;
}

export function shareCardPayload({ participants, durationMs, cost, currency = "KRW" }) {
  const minutes = Math.floor(durationMs / 60_000);
  return {
    title: `회의 비용 ${formatCurrency(cost, currency)}`,
    subtitle: `${participants}명 · ${minutes}분`,
    bg: cost > 1_000_000 ? "#dc2626" : cost > 100_000 ? "#f59e0b" : "#10b981",
  };
}
