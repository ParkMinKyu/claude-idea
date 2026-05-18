// Build daily review prompts using last N entries as context.

export function buildContext(entries, days = 7) {
  const recent = entries.slice(-days);
  const tags = {};
  const moods = [];
  for (const e of recent) {
    for (const t of e.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
    if (typeof e.mood === "number") moods.push(e.mood);
  }
  const topTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  return { topTags, avgMood, recentCount: recent.length };
}

export function buildPromptRequest(user, entries, today = new Date()) {
  const ctx = buildContext(entries);
  const lastEntry = entries[entries.length - 1];
  return {
    system:
      "You write 3 short reflection questions in Korean for a daily journaling app. " +
      "Use the user's recent themes and mood. Keep each question under 25 chars. " +
      "Output ONLY a JSON array of 3 strings.",
    user: JSON.stringify({
      date: today.toISOString().slice(0, 10),
      name: user.name ?? null,
      topTags: ctx.topTags,
      avgMood: ctx.avgMood,
      lastEntryExcerpt: lastEntry?.text?.slice(0, 200) ?? null,
    }),
  };
}

export function parsePromptResponse(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const arr = JSON.parse(cleaned);
  if (!Array.isArray(arr)) throw new Error("expected array");
  return arr.map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
}

const POSITIVE = ["기쁨", "감사", "행복", "뿌듯", "설렘"];
const NEGATIVE = ["불안", "분노", "슬픔", "지침", "후회"];

export function detectMood(text) {
  const t = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE) if (t.includes(w)) pos++;
  for (const w of NEGATIVE) if (t.includes(w)) neg++;
  if (pos === 0 && neg === 0) return { score: 0, label: "neutral" };
  const score = (pos - neg) / (pos + neg);
  return { score, label: score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral" };
}

export function shouldSendNow(localHour, prefs) {
  const start = prefs.startHour ?? 18;
  const end = prefs.endHour ?? 22;
  return localHour >= start && localHour <= end;
}
