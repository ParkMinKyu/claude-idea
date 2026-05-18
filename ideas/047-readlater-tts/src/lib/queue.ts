export interface QueueItem {
  id: string;
  url: string;
  title: string;
  addedAt: number;
  positionMs?: number;
  durationMs?: number;
  done?: boolean;
}

export const MAX_FREE_ITEMS = 10;

export function addItem(
  q: QueueItem[],
  item: Omit<QueueItem, "id" | "addedAt">,
  opts: { isPro: boolean } = { isPro: false }
): QueueItem[] {
  const exists = q.find((i) => i.url === item.url);
  if (exists) return q;
  const limit = opts.isPro ? Infinity : MAX_FREE_ITEMS;
  const next = [
    ...q,
    { ...item, id: cryptoId(), addedAt: Date.now() } as QueueItem,
  ];
  if (next.length > limit) {
    // drop the oldest done items first, then oldest
    const sorted = [...next].sort((a, b) => {
      if (a.done && !b.done) return -1;
      if (!a.done && b.done) return 1;
      return a.addedAt - b.addedAt;
    });
    return next.filter((i) => i.id !== sorted[0].id);
  }
  return next;
}

export function removeItem(q: QueueItem[], id: string): QueueItem[] {
  return q.filter((i) => i.id !== id);
}

export function markDone(q: QueueItem[], id: string): QueueItem[] {
  return q.map((i) => (i.id === id ? { ...i, done: true } : i));
}

export function reorder(q: QueueItem[], id: string, toIndex: number): QueueItem[] {
  const idx = q.findIndex((i) => i.id === id);
  if (idx < 0) return q;
  const arr = [...q];
  const [item] = arr.splice(idx, 1);
  arr.splice(Math.max(0, Math.min(arr.length, toIndex)), 0, item);
  return arr;
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
