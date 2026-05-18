import { addItem, QueueItem } from "./lib/queue";

const KEY = "tts.queue";

async function getQueue(): Promise<QueueItem[]> {
  return new Promise((r) =>
    chrome.storage.local.get(KEY, (d) => r((d[KEY] as QueueItem[]) ?? []))
  );
}
async function setQueue(q: QueueItem[]): Promise<void> {
  return new Promise((r) => chrome.storage.local.set({ [KEY]: q }, () => r()));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "queue.add") {
    (async () => {
      const q = await getQueue();
      const next = addItem(q, {
        url: msg.payload.url,
        title: msg.payload.title,
      });
      await setQueue(next);
      sendResponse({ ok: true, count: next.length });
    })();
    return true;
  }
  if (msg?.type === "queue.list") {
    getQueue().then((q) => sendResponse(q));
    return true;
  }
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "play-current") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["extract.js"],
      });
    }
  }
});
