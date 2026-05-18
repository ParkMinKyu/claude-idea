import { EventEmitter } from "node:events";

export type Phase = "focus" | "shortBreak" | "longBreak" | "idle";

export interface PomodoroConfig {
  focusMs: number;
  shortBreakMs: number;
  longBreakMs: number;
  sessionsBeforeLong: number;
}

export const DEFAULT_CFG: PomodoroConfig = {
  focusMs: 25 * 60_000,
  shortBreakMs: 5 * 60_000,
  longBreakMs: 15 * 60_000,
  sessionsBeforeLong: 4,
};

export function nextPhase(
  current: Phase,
  completedFocus: number,
  cfg: PomodoroConfig
): Phase {
  if (current === "idle") return "focus";
  if (current === "focus") {
    return completedFocus % cfg.sessionsBeforeLong === 0 ? "longBreak" : "shortBreak";
  }
  return "focus";
}

export function phaseDuration(phase: Phase, cfg: PomodoroConfig): number {
  switch (phase) {
    case "focus":
      return cfg.focusMs;
    case "shortBreak":
      return cfg.shortBreakMs;
    case "longBreak":
      return cfg.longBreakMs;
    default:
      return 0;
  }
}

export function fmtMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export class PomodoroTimer extends EventEmitter {
  private phase: Phase = "idle";
  private endsAt = 0;
  private interval: NodeJS.Timeout | null = null;
  private completedFocus = 0;
  private label = "";

  constructor(public cfg: PomodoroConfig = DEFAULT_CFG) {
    super();
  }

  start(label = ""): void {
    this.label = label;
    this.phase = "focus";
    this.endsAt = Date.now() + this.cfg.focusMs;
    this.tick();
    this.interval = setInterval(() => this.tick(), 250);
  }

  pause(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  skip(): void {
    this.complete();
  }

  remaining(now = Date.now()): number {
    if (this.phase === "idle") return 0;
    return Math.max(0, this.endsAt - now);
  }

  currentPhase(): Phase {
    return this.phase;
  }

  completedSessions(): number {
    return this.completedFocus;
  }

  private tick(): void {
    const left = this.remaining();
    this.emit("tick", { phase: this.phase, remaining: left, label: this.label });
    if (left <= 0 && this.phase !== "idle") this.complete();
  }

  private complete(): void {
    const finished = this.phase;
    if (finished === "focus") this.completedFocus++;
    this.emit("phase-end", { phase: finished, label: this.label, at: Date.now() });
    const next = nextPhase(finished, this.completedFocus, this.cfg);
    this.phase = next;
    this.endsAt = Date.now() + phaseDuration(next, this.cfg);
    this.emit("phase-start", { phase: next });
  }
}
