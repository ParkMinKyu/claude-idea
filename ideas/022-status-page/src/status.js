// Status page core: incident state machine, uptime aggregation, SSE serialization.

export const INCIDENT_STATES = ["investigating", "identified", "monitoring", "resolved"];
export const COMPONENT_STATES = ["operational", "degraded", "partial_outage", "major_outage", "maintenance"];

const NEXT_ALLOWED = {
  investigating: ["identified", "monitoring", "resolved"],
  identified: ["monitoring", "resolved"],
  monitoring: ["resolved", "identified"],
  resolved: [], // terminal
};

export function transitionIncident(incident, toState) {
  if (!INCIDENT_STATES.includes(toState)) throw new Error("unknown state");
  const allowed = NEXT_ALLOWED[incident.status] ?? [];
  if (!allowed.includes(toState)) throw new Error(`illegal transition: ${incident.status} -> ${toState}`);
  const now = new Date().toISOString();
  return {
    ...incident,
    status: toState,
    updatedAt: now,
    resolvedAt: toState === "resolved" ? now : incident.resolvedAt ?? null,
  };
}

export function worstStatus(componentStates) {
  const order = COMPONENT_STATES;
  let worst = "operational";
  for (const s of componentStates) {
    if (order.indexOf(s) > order.indexOf(worst)) worst = s;
  }
  return worst;
}

// uptime over last `days` days. checks = [{ at: iso, up: boolean }]
export function uptimePercent(checks, days = 90, now = Date.now()) {
  const since = now - days * 86_400_000;
  const recent = checks.filter((c) => new Date(c.at).getTime() >= since);
  if (recent.length === 0) return 100;
  const up = recent.filter((c) => c.up).length;
  return Math.round((up / recent.length) * 10_000) / 100;
}

// Build per-day buckets for heatmap. Returns array length=days, oldest first.
export function dailyHeatmap(checks, days = 90, now = Date.now()) {
  const buckets = Array.from({ length: days }, (_, i) => ({
    day: new Date(now - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    total: 0,
    up: 0,
  }));
  const index = new Map(buckets.map((b, i) => [b.day, i]));
  for (const c of checks) {
    const day = new Date(c.at).toISOString().slice(0, 10);
    const i = index.get(day);
    if (i == null) continue;
    buckets[i].total++;
    if (c.up) buckets[i].up++;
  }
  return buckets.map((b) => ({
    day: b.day,
    uptime: b.total === 0 ? null : Math.round((b.up / b.total) * 1000) / 10,
  }));
}

export function serializeSse(event, data) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${payload}\n\n`;
}
