import { loadConfig, saveConfig } from "./lib/storage";

async function init() {
  const cfg = await loadConfig();
  (document.getElementById("whitelist") as HTMLTextAreaElement).value =
    cfg.whitelist.join("\n");
  (document.getElementById("pinned") as HTMLInputElement).checked = cfg.excludePinned;
  (document.getElementById("audible") as HTMLInputElement).checked = cfg.excludeAudible;
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  document.getElementById("save")?.addEventListener("click", async () => {
    const cfg = await loadConfig();
    cfg.whitelist = (document.getElementById("whitelist") as HTMLTextAreaElement)
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    cfg.excludePinned = (document.getElementById("pinned") as HTMLInputElement).checked;
    cfg.excludeAudible = (document.getElementById("audible") as HTMLInputElement).checked;
    await saveConfig(cfg);
    const status = document.getElementById("status");
    if (status) status.textContent = "Saved!";
  });
});
