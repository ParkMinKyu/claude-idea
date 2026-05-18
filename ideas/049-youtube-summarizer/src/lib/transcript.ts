export interface Cue {
  start: number; // seconds
  duration: number;
  text: string;
}

export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

/** Parse YouTube `timedtext?fmt=json3` payload. */
export function parseJson3(json: unknown): Cue[] {
  const evs = (json as { events?: Array<Record<string, unknown>> })?.events ?? [];
  const out: Cue[] = [];
  for (const e of evs) {
    const segs = (e as { segs?: Array<{ utf8?: string }> }).segs;
    if (!Array.isArray(segs)) continue;
    const text = segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\n+/g, " ")
      .trim();
    if (!text) continue;
    const startMs = Number((e as { tStartMs?: number }).tStartMs ?? 0);
    const dur = Number((e as { dDurationMs?: number }).dDurationMs ?? 0);
    out.push({ start: startMs / 1000, duration: dur / 1000, text });
  }
  return out;
}

/** Parse YouTube XML timedtext format. */
export function parseXml(xml: string): Cue[] {
  const re = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  const out: Cue[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push({
      start: parseFloat(m[1]),
      duration: parseFloat(m[2]),
      text: decodeEntities(m[3]),
    });
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

export function cuesToText(cues: Cue[]): string {
  return cues.map((c) => `[${fmt(c.start)}] ${c.text}`).join("\n");
}

export function fmt(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
