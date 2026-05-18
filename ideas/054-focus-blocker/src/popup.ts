document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "rules.list" }, (rules) => {
    const root = document.getElementById("rules")!;
    if (!rules?.length) {
      root.textContent = "No rules yet.";
      return;
    }
    for (const r of rules) {
      const li = document.createElement("li");
      li.textContent = `${r.pattern} ${r.enabled ? "" : "(off)"}`;
      root.appendChild(li);
    }
  });
});
