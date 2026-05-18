// Build retention curve from raw heartbeat events.
// Each event = { videoId, sessionId, progressRatio (0..1), ts }
// Output for one video: percent of unique sessions that reached each 25% mark.

const MARKS = [0.25, 0.5, 0.75, 1.0];

export function retentionCurve(events) {
  const reached = new Map(); // sessionId -> max progress observed
  for (const e of events) {
    const r = clamp01(Number(e.progressRatio));
    const prev = reached.get(e.sessionId) ?? 0;
    if (r > prev) reached.set(e.sessionId, r);
  }
  const total = reached.size;
  if (total === 0) return MARKS.map((m) => ({ mark: m, ratio: 0 }));

  return MARKS.map((m) => {
    let hit = 0;
    for (const r of reached.values()) if (r >= m - 1e-6) hit++;
    return { mark: m, ratio: hit / total };
  });
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// Decide whether to insert an ad before this video, given user impressions
// and frequency caps. Returns the ad slot id or null.
export function pickAdSlot({
  index, // 0-based position in the user's feed session
  frequency = 4, // every Nth video
  capPerHour = 12,
  impressionsLastHour = 0,
  slots = [],
}) {
  if (!Array.isArray(slots) || slots.length === 0) return null;
  if (impressionsLastHour >= capPerHour) return null;
  if (index <= 0 || index % frequency !== 0) return null;
  // Rotate slots round-robin based on index for determinism.
  const i = Math.floor(index / frequency - 1) % slots.length;
  return slots[i] || null;
}
