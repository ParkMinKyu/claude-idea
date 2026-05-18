declare global {
  interface Window {
    pomo: {
      start(label: string): Promise<void>;
      pause(): Promise<void>;
      skip(): Promise<void>;
      stats(): Promise<Array<{ label: string; startedAt: number; endedAt: number }>>;
    };
  }
}

async function refresh() {
  const entries = await window.pomo.stats();
  const byDay: Record<string, number> = {};
  const byLabel: Record<string, number> = {};
  for (const e of entries) {
    const k = new Date(e.startedAt).toISOString().slice(0, 10);
    const mins = (e.endedAt - e.startedAt) / 60000;
    byDay[k] = (byDay[k] ?? 0) + mins;
    byLabel[e.label || "(no label)"] = (byLabel[e.label || "(no label)"] ?? 0) + mins;
  }
  renderMap("byDay", byDay);
  renderMap("byLabel", byLabel);
}

function renderMap(id: string, m: Record<string, number>) {
  const ul = document.getElementById(id)!;
  ul.innerHTML = "";
  for (const [k, v] of Object.entries(m).sort()) {
    const li = document.createElement("li");
    li.textContent = `${k}: ${v.toFixed(0)}m`;
    ul.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refresh();
  document.getElementById("start")?.addEventListener("click", () => {
    const v = (document.getElementById("label") as HTMLInputElement).value;
    window.pomo.start(v);
  });
  document.getElementById("pause")?.addEventListener("click", () => window.pomo.pause());
  document.getElementById("skip")?.addEventListener("click", async () => {
    await window.pomo.skip();
    refresh();
  });
});

export {};
