// Flash-sale alerts MVP — detect new sales, match user subscriptions,
// throttle notifications, build payloads for Web Push.

export function detectNewSales(currentList, knownSet) {
  // currentList: parsed sales from latest crawl
  // knownSet: Set of sale ids already notified
  const newOnes = [];
  for (const sale of currentList) {
    if (!sale.id) throw new Error("sale.id required");
    if (!knownSet.has(sale.id)) newOnes.push(sale);
  }
  return newOnes;
}

export function matchSubscribers(sale, subscriptions, nowMs = Date.now()) {
  const matched = [];
  for (const sub of subscriptions) {
    if (!isWithinQuietHours(nowMs, sub.timezoneOffsetMin ?? 0, sub.quietHours)) {
      // user wants no notifications now
      continue;
    }
    if (sub.brands && !sub.brands.includes(sale.brand)) continue;
    if (sub.categories && !sub.categories.includes(sale.category)) continue;
    if (sub.minDiscountPct != null && sale.discountPct < sub.minDiscountPct) continue;
    matched.push(sub);
  }
  return matched;
}

function isWithinQuietHours(nowMs, tzOffsetMin, quiet) {
  if (!quiet) return true; // no quiet config => always allowed
  const local = new Date(nowMs + tzOffsetMin * 60_000);
  const hour = local.getUTCHours();
  const { startHour, endHour } = quiet;
  if (startHour == null || endHour == null) return true;
  if (startHour < endHour) {
    return !(hour >= startHour && hour < endHour);
  }
  // wraps midnight (e.g., 23 → 7)
  return !(hour >= startHour || hour < endHour);
}

// Throttle: never send a user more than N notifications per hour.
export function applyThrottle(matches, recentSendsByUser, perHour = 10, nowMs = Date.now()) {
  const HOUR = 60 * 60 * 1000;
  return matches.filter((sub) => {
    const recent = (recentSendsByUser.get(sub.userId) ?? []).filter((t) => nowMs - t < HOUR);
    if (recent.length >= perHour) return false;
    recent.push(nowMs);
    recentSendsByUser.set(sub.userId, recent);
    return true;
  });
}

export function buildPushPayload(sale) {
  const endsAtTs = sale.endsAt ? new Date(sale.endsAt).getTime() : null;
  const minutesLeft = endsAtTs ? Math.max(0, Math.round((endsAtTs - Date.now()) / 60_000)) : null;
  return {
    title: `${sale.brand} ${sale.discountPct}% OFF`,
    body: minutesLeft != null
      ? `${sale.title} — ${minutesLeft}분 남음`
      : sale.title,
    url: sale.url,
    icon: sale.imageUrl ?? "/icon-192.png",
    tag: `sale-${sale.id}`,
    requireInteraction: minutesLeft != null && minutesLeft < 60,
  };
}

// Determine which sales need an "ending soon" reminder right now.
export function endingSoonSales(sales, nowMs = Date.now(), windowMin = 30) {
  return sales.filter((s) => {
    if (!s.endsAt) return false;
    const remaining = new Date(s.endsAt).getTime() - nowMs;
    return remaining > 0 && remaining <= windowMin * 60_000;
  });
}
