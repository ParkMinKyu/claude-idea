import { ClipboardItem } from "./clipboard-watcher";

export interface SnippetEntry extends ClipboardItem {
  id: string;
  pinned?: boolean;
  label?: string;
}

export function tokenize(s: string): string[] {
  return s.toLowerCase().split(/\W+/).filter(Boolean);
}

export function score(entry: SnippetEntry, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;
  const haystack = (entry.label ?? "") + " " + entry.content.toLowerCase();
  let s = 0;
  for (const q of queryTokens) {
    if (haystack.includes(q)) s += 1;
  }
  if (entry.pinned) s += 0.5;
  return s;
}

export function search(entries: SnippetEntry[], query: string, limit = 50): SnippetEntry[] {
  const tokens = tokenize(query);
  return entries
    .map((e) => ({ e, s: score(e, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return b.e.capturedAt - a.e.capturedAt;
    })
    .slice(0, limit)
    .map((x) => x.e);
}

export function detectCodeBlock(s: string): boolean {
  const lines = s.split("\n");
  if (lines.length < 2) return /^[ \t]*(function|class|const|let|var|import|def|public|private)\b/.test(s);
  let codey = 0;
  for (const line of lines) {
    if (/^[ \t]/.test(line)) codey++;
    if (/[;{}=()<>]/.test(line)) codey++;
  }
  return codey >= lines.length;
}

export function enforceFreeLimit<T>(arr: T[], isPro: boolean, limit = 500): T[] {
  if (isPro) return arr;
  return arr.slice(-limit);
}
