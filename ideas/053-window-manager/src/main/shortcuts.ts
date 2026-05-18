import { LayoutId } from "./layouts";

export const DEFAULT_SHORTCUTS: Record<string, LayoutId> = {
  "CommandOrControl+Alt+Left": "left-half",
  "CommandOrControl+Alt+Right": "right-half",
  "CommandOrControl+Alt+Up": "top-half",
  "CommandOrControl+Alt+Down": "bottom-half",
  "CommandOrControl+Alt+U": "top-left",
  "CommandOrControl+Alt+I": "top-right",
  "CommandOrControl+Alt+J": "bottom-left",
  "CommandOrControl+Alt+K": "bottom-right",
  "CommandOrControl+Alt+C": "center",
  "CommandOrControl+Alt+F": "fullscreen",
};

const VALID_KEY = /^[A-Za-z0-9]$|^F[1-9]$|^F1[0-2]$|^(Left|Right|Up|Down|Tab|Space)$/;

export function isValidAccelerator(s: string): boolean {
  const parts = s.split("+").map((p) => p.trim());
  if (parts.length < 2) return false;
  const mods = parts.slice(0, -1);
  const key = parts[parts.length - 1];
  for (const m of mods) {
    if (!/^(CommandOrControl|Command|Control|Ctrl|Alt|Shift|Super|Cmd|Option)$/.test(m))
      return false;
  }
  return VALID_KEY.test(key);
}

export function mergeShortcuts(
  defaults: Record<string, LayoutId>,
  user: Record<string, LayoutId>
): Record<string, LayoutId> {
  const out: Record<string, LayoutId> = { ...defaults };
  for (const [k, v] of Object.entries(user)) {
    if (isValidAccelerator(k)) out[k] = v;
  }
  return out;
}
