interface Item {
  asin: string;
  title: string;
  currency: string;
  history: Array<{ at: number; amount: number }>;
  targetPrice?: number;
}

function render(items: Item[]) {
  const list = document.getElementById("list")!;
  list.innerHTML = "";
  if (!items.length) {
    list.textContent = "No tracked products yet.";
    return;
  }
  for (const i of items) {
    const last = i.history[i.history.length - 1];
    const div = document.createElement("div");
    div.style.cssText = "border-bottom:1px solid #eee;padding:6px 0;";
    div.innerHTML = `
      <div style="font-weight:600;font-size:12px;">${escape(i.title.slice(0, 50))}</div>
      <div style="font-size:11px;color:#666;">
        ${last ? `${last.amount} ${i.currency}` : "—"}
        ${i.targetPrice ? ` / target ${i.targetPrice}` : ""}
      </div>`;
    list.appendChild(div);
  }
}

function escape(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "track.list" }, (items: Item[]) => render(items ?? []));
});
