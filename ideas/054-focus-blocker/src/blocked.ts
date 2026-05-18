document.addEventListener("DOMContentLoaded", () => {
  const target = new URLSearchParams(location.search).get("url");
  const t = document.getElementById("target");
  if (t && target) t.textContent = target;
  try {
    if (target) {
      const host = new URL(target).host;
      chrome.runtime.sendMessage({ type: "stats.hit", payload: { host } });
    }
  } catch {
    /* ignore */
  }
});
