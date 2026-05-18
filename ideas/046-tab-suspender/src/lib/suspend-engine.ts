export interface TabInfo {
  id: number;
  url?: string;
  active: boolean;
  pinned: boolean;
  audible?: boolean;
  discarded?: boolean;
  lastActivityMs: number;
}

export interface SuspendConfig {
  idleThresholdMs: number; // e.g. 30 * 60 * 1000
  whitelist: string[]; // host patterns
  excludePinned: boolean;
  excludeAudible: boolean;
}

export const DEFAULT_CONFIG: SuspendConfig = {
  idleThresholdMs: 30 * 60 * 1000,
  whitelist: [],
  excludePinned: true,
  excludeAudible: true,
};

export function hostMatches(url: string | undefined, patterns: string[]): boolean {
  if (!url) return false;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return patterns.some((p) => {
    if (p.startsWith("*.")) {
      const suffix = p.slice(1); // .example.com
      return host === suffix.slice(1) || host.endsWith(suffix);
    }
    return host === p;
  });
}

export function shouldSuspend(
  tab: TabInfo,
  now: number,
  cfg: SuspendConfig
): boolean {
  if (tab.active) return false;
  if (tab.discarded) return false;
  if (cfg.excludePinned && tab.pinned) return false;
  if (cfg.excludeAudible && tab.audible) return false;
  if (hostMatches(tab.url, cfg.whitelist)) return false;
  if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://"))
    return false;
  return now - tab.lastActivityMs >= cfg.idleThresholdMs;
}

export function pickSuspendCandidates(
  tabs: TabInfo[],
  now: number,
  cfg: SuspendConfig
): number[] {
  return tabs.filter((t) => shouldSuspend(t, now, cfg)).map((t) => t.id);
}
