import { getHistory } from "./lib/storage";

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("history")!;
  const items = await getHistory();
  if (!items.length) {
    list.textContent = "No summaries yet.";
    return;
  }
  for (const i of items) {
    const div = document.createElement("div");
    div.style.cssText = "border-bottom:1px solid #eee;padding:6px 0;";
    div.innerHTML = `
      <div style="font-weight:600;font-size:12px;">${escapeHtml(i.title)}</div>
      <div style="font-size:11px;color:#666;">${escapeHtml(i.tldr).slice(0, 200)}</div>`;
    list.appendChild(div);
  }
});

function escapeHtml(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
