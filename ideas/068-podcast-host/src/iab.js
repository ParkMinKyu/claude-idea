// IAB Tech Lab Podcast Measurement v2.1 download filter.
// Rules implemented:
//   - Reject known bot/crawler user agents
//   - Require >= 60 seconds OR >= 1 byte beyond the first 1 MB chunk
//   - Dedupe same (ip /24, ua, episode) within 24h window

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /preview/i, /fetcher/i,
  /yahoo!/i, /facebookexternalhit/i, /slackbot/i, /pingdom/i,
  /headlesschrome/i, /uptime/i, /monitor/i,
];

export function isBotUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return true;
  return BOT_PATTERNS.some((r) => r.test(ua));
}

// Crop IPv4 to /24 and IPv6 to /48 for privacy + dedupe key.
export function ipPrefix(ip) {
  if (!ip || typeof ip !== 'string') return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length !== 4) return ip;
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':').slice(0, 3);
    return `${parts.join(':')}::/48`;
  }
  return ip;
}

export function dedupeKey({ episodeId, ip, ua }) {
  return `${episodeId}|${ipPrefix(ip)}|${(ua || '').slice(0, 64)}`;
}

// Filter a stream of raw access log events into IAB-countable downloads.
// `events` shape: { ts, episodeId, ip, ua, bytes, secondsPlayed }
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MIN_BYTES = 1024 * 1024; // 1 MB
const MIN_SECONDS = 60;

export function countIabDownloads(events) {
  const seen = new Map(); // key -> ts
  let count = 0;
  for (const ev of events) {
    if (isBotUserAgent(ev.ua)) continue;
    const bytes = Number(ev.bytes) || 0;
    const secs = Number(ev.secondsPlayed) || 0;
    if (bytes < MIN_BYTES && secs < MIN_SECONDS) continue;
    const key = dedupeKey(ev);
    const ts = new Date(ev.ts).getTime();
    const prev = seen.get(key);
    if (prev && ts - prev < ONE_DAY_MS) continue;
    seen.set(key, ts);
    count++;
  }
  return count;
}
