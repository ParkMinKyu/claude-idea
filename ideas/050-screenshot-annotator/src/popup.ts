import { captureVisible } from "./lib/capture";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("capture")?.addEventListener("click", async () => {
    const dataUrl = await captureVisible();
    await chrome.storage.local.set({ "snap.pending": dataUrl });
    chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") });
    window.close();
  });
});
