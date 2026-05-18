export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface ScheduleWindow {
  days: Weekday[]; // active days
  startMin: number; // minutes from midnight
  endMin: number; // exclusive
}

export interface BlockRule {
  id: string;
  pattern: string; // e.g. *://*.twitter.com/*
  windows: ScheduleWindow[];
  enabled: boolean;
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function isActive(win: ScheduleWindow, at: Date): boolean {
  const day = at.getDay() as Weekday;
  if (!win.days.includes(day)) return false;
  const m = minutesOfDay(at);
  // handle wrap-around windows like 22:00-06:00 (start > end)
  if (win.startMin <= win.endMin) {
    return m >= win.startMin && m < win.endMin;
  }
  return m >= win.startMin || m < win.endMin;
}

export function isRuleActive(rule: BlockRule, at: Date): boolean {
  if (!rule.enabled) return false;
  return rule.windows.some((w) => isActive(w, at));
}

export function activeRules(rules: BlockRule[], at: Date): BlockRule[] {
  return rules.filter((r) => isRuleActive(r, at));
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59)
    throw new Error("invalid time");
  return h * 60 + m;
}
