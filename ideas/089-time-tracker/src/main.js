// Electron main process entry — runs the 5s polling loop.
// Stubbed `active-win` import so tests don't require the native module.

import { mergeSegments, dailyReport, defaultRules } from "./tracker.js";

const POLL_MS = 5000;
const IDLE_MS = 60_000;

export async function startTracker({ activeWin, idle, store, intervalMs = POLL_MS }) {
  const events = [];
  const tick = async () => {
    const win = await activeWin();
    const idleSec = await idle();
    events.push({
      at: Date.now(),
      app: win?.owner?.name ?? "unknown",
      title: win?.title ?? "",
      idle: idleSec * 1000 > IDLE_MS,
    });
    if (events.length % 12 === 0) {
      const segs = mergeSegments(events);
      await store.persist(segs);
    }
  };
  const handle = setInterval(tick, intervalMs);
  return {
    stop: () => clearInterval(handle),
    snapshot: () => dailyReport(mergeSegments(events), defaultRules),
  };
}

// Real Electron entry (skipped during tests).
if (process.env.RUN_ELECTRON === "1") {
  const { app, Tray, Menu, powerMonitor } = await import("electron");
  const activeWin = (await import("active-win")).default;
  app.whenReady().then(async () => {
    const tray = new Tray(/* path to icon */);
    const tracker = await startTracker({
      activeWin,
      idle: async () => powerMonitor.getSystemIdleTime(),
      store: { persist: async () => {} },
    });
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Today report", click: () => console.log(tracker.snapshot()) },
        { label: "Quit", click: () => app.quit() },
      ])
    );
  });
}
