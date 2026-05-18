import { loadConfig } from "./lib/storage";
import { pickSuspendCandidates, TabInfo } from "./lib/suspend-engine";

const ALARM = "suspender.tick";
const activity = new Map<number, number>();

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: 1 });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  activity.set(tabId, Date.now());
});

chrome.tabs.onUpdated.addListener((tabId) => {
  activity.set(tabId, Date.now());
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activity.delete(tabId);
});

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== ALARM) return;
  const cfg = await loadConfig();
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const infos: TabInfo[] = tabs.map((t) => ({
    id: t.id ?? -1,
    url: t.url,
    active: t.active,
    pinned: t.pinned,
    audible: t.audible,
    discarded: t.discarded,
    lastActivityMs: activity.get(t.id ?? -1) ?? now - cfg.idleThresholdMs - 1,
  }));
  const targets = pickSuspendCandidates(infos, now, cfg);
  for (const id of targets) {
    if (id > 0) chrome.tabs.discard(id).catch(() => {});
  }
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "suspend-current") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.discard(tab.id);
  }
});
