declare global {
  interface Window {
    cpp: {
      add(hex: string): Promise<{ swatches: { id: string; hex: string }[] }>;
      list(): Promise<{ swatches: { id: string; hex: string }[] }>;
      onPick(cb: () => void): void;
    };
    EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
  }
}

async function render() {
  const p = await window.cpp.list();
  const list = document.getElementById("list")!;
  list.innerHTML = "";
  for (const s of p.swatches) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span class="sw" style="background:${s.hex}"></span><code>${s.hex}</code>`;
    list.appendChild(row);
  }
}

async function pick() {
  const Eye = window.EyeDropper;
  if (!Eye) {
    alert("EyeDropper not available in this Electron build");
    return;
  }
  const e = new Eye();
  const res = await e.open();
  await window.cpp.add(res.sRGBHex);
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  window.cpp.onPick(pick);
});

export {};
