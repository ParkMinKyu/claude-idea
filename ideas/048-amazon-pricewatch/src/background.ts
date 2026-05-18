import { appendPrice, getAll, saveAll, shouldNotify, upsert } from "./lib/store";
import { parsePriceFromHtml } from "./lib/parse-price";

const ALARM = "pricewatch.tick";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: 12 * 60 });
});

async function refreshOne(asin: string) {
  const all = await getAll();
  const p = all.find((x) => x.asin === asin);
  if (!p) return;
  try {
    const res = await fetch(p.url, { credentials: "omit" });
    const html = await res.text();
    const price = parsePriceFromHtml(html);
    if (!price) return;
    const notify = shouldNotify(p, price.amount);
    const updated = appendPrice(p, price.amount);
    await saveAll(upsert(all, updated));
    if (notify) {
      chrome.notifications.create(`drop-${asin}`, {
        type: "basic",
        title: `Price drop: ${p.title.slice(0, 50)}`,
        message: `Now ${price.amount} ${price.currency} (target ${p.targetPrice})`,
        iconUrl: "icons/icon128.png",
      });
    }
  } catch (e) {
    console.warn("refresh failed", asin, e);
  }
}

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== ALARM) return;
  const all = await getAll();
  for (const p of all) await refreshOne(p.asin);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "track.add") {
    (async () => {
      const all = await getAll();
      const next = upsert(all, msg.payload);
      await saveAll(next);
      sendResponse({ ok: true });
      refreshOne(msg.payload.asin);
    })();
    return true;
  }
  if (msg?.type === "track.list") {
    getAll().then((a) => sendResponse(a));
    return true;
  }
});
