import { loadConfig, saveConfig } from "./lib/storage";

async function render() {
  const cfg = await loadConfig();
  const mins = Math.round(cfg.idleThresholdMs / 60000);
  const el = document.getElementById("threshold") as HTMLInputElement;
  if (el) el.value = String(mins);
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  document.getElementById("save")?.addEventListener("click", async () => {
    const el = document.getElementById("threshold") as HTMLInputElement;
    const cfg = await loadConfig();
    cfg.idleThresholdMs = Math.max(1, Number(el.value)) * 60000;
    await saveConfig(cfg);
    window.close();
  });
  document.getElementById("suspend-now")?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.discard(tab.id);
    window.close();
  });
});
