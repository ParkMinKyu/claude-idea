// Minimal uptime checker — pure function + scheduler entry.
// Real product would persist to Postgres and dispatch alerts via Resend/Slack.

export async function checkMonitor(monitor, fetchImpl = fetch) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), monitor.timeoutMs ?? 10_000);
  try {
    const res = await fetchImpl(monitor.url, {
      method: monitor.method ?? "GET",
      signal: controller.signal,
      redirect: "follow",
    });
    const latency = Date.now() - start;
    const expected = monitor.expectedStatus ?? 200;
    const up = res.status === expected;
    return { url: monitor.url, up, status: res.status, latencyMs: latency, at: new Date().toISOString() };
  } catch (err) {
    return {
      url: monitor.url,
      up: false,
      status: 0,
      latencyMs: Date.now() - start,
      error: err.name === "AbortError" ? "timeout" : err.message,
      at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function shouldAlert(previousState, currentResult, debounce = 2) {
  // Alert only after `debounce` consecutive failures to avoid blips.
  const streak = currentResult.up ? 0 : (previousState.failStreak ?? 0) + 1;
  const wasDown = previousState.lastNotifiedDown === true;
  const shouldNotifyDown = !currentResult.up && streak >= debounce && !wasDown;
  const shouldNotifyUp = currentResult.up && wasDown;
  return {
    nextState: {
      failStreak: streak,
      lastNotifiedDown: shouldNotifyDown ? true : shouldNotifyUp ? false : wasDown,
    },
    notify: shouldNotifyDown ? "down" : shouldNotifyUp ? "up" : null,
  };
}

export async function runCycle(monitors, store, fetchImpl) {
  const results = [];
  for (const m of monitors) {
    const result = await checkMonitor(m, fetchImpl);
    const prev = store.get(m.id) ?? {};
    const { nextState, notify } = shouldAlert(prev, result, m.debounce);
    store.set(m.id, nextState);
    results.push({ monitor: m, result, notify });
  }
  return results;
}

// CLI entry point — runs every minute when executed directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  const cron = (await import("node-cron")).default;
  const monitors = [
    { id: "demo", url: "https://example.com", expectedStatus: 200, debounce: 2 },
  ];
  const state = new Map();
  cron.schedule("* * * * *", async () => {
    const out = await runCycle(monitors, state);
    console.log(JSON.stringify(out, null, 2));
  });
  console.log("uptime checker started");
}
