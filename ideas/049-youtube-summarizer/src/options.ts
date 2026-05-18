import { getSettings, saveSettings } from "./lib/storage";

document.addEventListener("DOMContentLoaded", async () => {
  const s = await getSettings();
  (document.getElementById("apiKey") as HTMLInputElement).value = s.apiKey;
  (document.getElementById("lang") as HTMLSelectElement).value = s.language;
  document.getElementById("save")?.addEventListener("click", async () => {
    await saveSettings({
      apiKey: (document.getElementById("apiKey") as HTMLInputElement).value.trim(),
      language: (document.getElementById("lang") as HTMLSelectElement).value as
        | "ko"
        | "en"
        | "ja",
    });
    const status = document.getElementById("status");
    if (status) status.textContent = "Saved.";
  });
});
