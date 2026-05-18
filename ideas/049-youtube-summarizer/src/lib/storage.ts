export interface Settings {
  apiKey: string;
  language: "ko" | "en" | "ja";
}
const SK = "ytsum.settings";
const HK = "ytsum.history";

export async function getSettings(): Promise<Settings> {
  return new Promise((r) =>
    chrome.storage.sync.get(SK, (d) =>
      r({ apiKey: "", language: "ko", ...(d[SK] ?? {}) })
    )
  );
}
export async function saveSettings(s: Settings): Promise<void> {
  return new Promise((r) => chrome.storage.sync.set({ [SK]: s }, () => r()));
}

export interface HistoryEntry {
  videoId: string;
  title: string;
  at: number;
  tldr: string;
}
export async function getHistory(): Promise<HistoryEntry[]> {
  return new Promise((r) =>
    chrome.storage.local.get(HK, (d) => r((d[HK] as HistoryEntry[]) ?? []))
  );
}
export async function pushHistory(e: HistoryEntry, max = 50): Promise<void> {
  const cur = await getHistory();
  const next = [e, ...cur.filter((x) => x.videoId !== e.videoId)].slice(0, max);
  return new Promise((r) => chrome.storage.local.set({ [HK]: next }, () => r()));
}
