import { activeRules, BlockRule } from "./lib/schedule";
import { diffRuleIds, toDnrRules } from "./lib/rules";

const RULES_KEY = "fb.rules";
const STATS_KEY = "fb.stats";
let currentDnr: ReturnType<typeof toDnrRules> = [];

async function loadRules(): Promise<BlockRule[]> {
  return new Promise((r) =>
    chrome.storage.sync.get(RULES_KEY, (d) => r((d[RULES_KEY] as BlockRule[]) ?? []))
  );
}

async function saveRules(rules: BlockRule[]): Promise<void> {
  return new Promise((r) => chrome.storage.sync.set({ [RULES_KEY]: rules }, () => r()));
}

async function refresh() {
  const rules = await loadRules();
  const active = activeRules(rules, new Date());
  const next = toDnrRules(active);
  const { addRules, removeRuleIds } = diffRuleIds(currentDnr, next);
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds });
  currentDnr = next;
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create("fb.refresh", { periodInMinutes: 1 });
  await refresh();
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "fb.refresh") refresh();
});

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg?.type === "rules.list") {
    loadRules().then(sendResponse);
    return true;
  }
  if (msg?.type === "rules.save") {
    saveRules(msg.payload as BlockRule[]).then(async () => {
      await refresh();
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg?.type === "stats.hit") {
    bumpStat(msg.payload.host);
    return false;
  }
});

async function bumpStat(host: string) {
  const day = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get(STATS_KEY);
  const stats = (data[STATS_KEY] ?? {}) as Record<string, Record<string, number>>;
  stats[day] = stats[day] ?? {};
  stats[day][host] = (stats[day][host] ?? 0) + 1;
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}
