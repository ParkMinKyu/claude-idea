// Detect form interaction so we don't suspend tabs the user is typing in.
let lastFormTouch = 0;
document.addEventListener(
  "input",
  (e) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) {
      lastFormTouch = Date.now();
      chrome.runtime.sendMessage({ type: "form-touch", at: lastFormTouch });
    }
  },
  true
);
