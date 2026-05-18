export interface TrackedProduct {
  asin: string;
  url: string;
  title: string;
  targetPrice?: number;
  currency: string;
  addedAt: number;
  history: Array<{ at: number; amount: number }>;
}

const KEY = "pricewatch.tracked";

export async function getAll(): Promise<TrackedProduct[]> {
  return new Promise((r) =>
    chrome.storage.local.get(KEY, (d) => r((d[KEY] as TrackedProduct[]) ?? []))
  );
}

export async function saveAll(arr: TrackedProduct[]): Promise<void> {
  return new Promise((r) => chrome.storage.local.set({ [KEY]: arr }, () => r()));
}

export function upsert(arr: TrackedProduct[], p: TrackedProduct): TrackedProduct[] {
  const idx = arr.findIndex((x) => x.asin === p.asin);
  if (idx >= 0) {
    const updated = [...arr];
    updated[idx] = { ...arr[idx], ...p };
    return updated;
  }
  return [...arr, p];
}

export function appendPrice(
  p: TrackedProduct,
  amount: number,
  at = Date.now(),
  maxPoints = 200
): TrackedProduct {
  const history = [...p.history, { at, amount }].slice(-maxPoints);
  return { ...p, history };
}

export function shouldNotify(p: TrackedProduct, currentPrice: number): boolean {
  if (!p.targetPrice) return false;
  if (currentPrice > p.targetPrice) return false;
  // Avoid double notification: only if last price was above target
  const prev = p.history[p.history.length - 1];
  if (prev && prev.amount <= p.targetPrice) return false;
  return true;
}
