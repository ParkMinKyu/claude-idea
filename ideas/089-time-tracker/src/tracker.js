// Pure logic for time tracking: classifier + segment merger + reports.

export function classify(event, rules) {
  for (const r of rules) {
    if (r.app && new RegExp(r.app, "i").test(event.app)) return r.category;
    if (r.title && new RegExp(r.title, "i").test(event.title)) return r.category;
  }
  return "uncategorized";
}

export const defaultRules = [
  { app: "code|terminal|iterm|alacritty|kitty", category: "code" },
  { app: "slack|discord|teams|zoom|meet", category: "communication" },
  { app: "youtube|netflix|twitch", category: "distract" },
  { app: "chrome|firefox|safari|edge|brave", category: "browse" },
  { app: "figma|sketch|photoshop", category: "design" },
];

export function mergeSegments(events, idleMs = 60_000) {
  // events: [{ at: epochMs, app, title, idle: bool }]
  const segs = [];
  for (const e of events) {
    if (e.idle) continue;
    const last = segs[segs.length - 1];
    if (
      last &&
      last.app === e.app &&
      last.title === e.title &&
      e.at - last.endsAt <= idleMs
    ) {
      last.endsAt = e.at;
      last.durationMs = last.endsAt - last.startsAt;
    } else {
      segs.push({
        app: e.app,
        title: e.title,
        startsAt: e.at,
        endsAt: e.at,
        durationMs: 0,
      });
    }
  }
  return segs;
}

export function dailyReport(segments, rules = defaultRules) {
  const byApp = {};
  const byCategory = {};
  let total = 0;
  for (const s of segments) {
    const cat = classify({ app: s.app, title: s.title }, rules);
    byApp[s.app] = (byApp[s.app] ?? 0) + s.durationMs;
    byCategory[cat] = (byCategory[cat] ?? 0) + s.durationMs;
    total += s.durationMs;
  }
  const top = Object.entries(byApp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([app, ms]) => ({ app, ms }));
  return { totalMs: total, byCategory, topApps: top };
}
