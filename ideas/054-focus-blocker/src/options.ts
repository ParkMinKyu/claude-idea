import { BlockRule, parseHHMM } from "./lib/schedule";

let rules: BlockRule[] = [];

function render() {
  const root = document.getElementById("rules")!;
  root.innerHTML = "";
  for (const r of rules) {
    const div = document.createElement("div");
    div.style.cssText = "border:1px solid #ddd;padding:8px;margin:6px 0;";
    div.innerHTML = `<strong>${escape(r.pattern)}</strong> ${r.enabled ? "" : "(off)"}`;
    root.appendChild(div);
  }
}
function escape(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "rules.list" }, (r) => {
    rules = r ?? [];
    render();
  });
  document.getElementById("add")?.addEventListener("click", () => {
    const pattern = (document.getElementById("pattern") as HTMLInputElement).value.trim();
    const start = (document.getElementById("start") as HTMLInputElement).value;
    const end = (document.getElementById("end") as HTMLInputElement).value;
    if (!pattern) return;
    const startMin = parseHHMM(start || "09:00");
    const endMin = parseHHMM(end || "18:00");
    rules.push({
      id: `r${Date.now()}`,
      pattern,
      enabled: true,
      windows: [{ days: [1, 2, 3, 4, 5], startMin, endMin }],
    });
    chrome.runtime.sendMessage({ type: "rules.save", payload: rules }, () => render());
  });
});
