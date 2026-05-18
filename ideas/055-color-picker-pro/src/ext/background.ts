// MV3 service worker entry. Could route messages for popup; for now just keep alive.
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setTitle({ title: "Color Picker Pro" });
});
