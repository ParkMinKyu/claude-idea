import { captureVisible } from "./lib/capture";

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "capture-visible") {
    const dataUrl = await captureVisible();
    await chrome.storage.local.set({ "snap.pending": dataUrl });
    chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") });
  }
});

chrome.action.onClicked.addListener(async () => {
  const dataUrl = await captureVisible();
  await chrome.storage.local.set({ "snap.pending": dataUrl });
  chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") });
});
