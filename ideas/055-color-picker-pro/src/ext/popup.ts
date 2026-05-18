import { addSwatch, Palette, toCssVariables } from "../lib/palette";
import { contrast, hexToRgb, wcagLevel } from "../lib/color";

const KEY = "cpp.palette";

async function load(): Promise<Palette> {
  return new Promise((r) =>
    chrome.storage.local.get(KEY, (d) =>
      r((d[KEY] as Palette) ?? { id: "default", name: "Default", swatches: [] })
    )
  );
}
async function save(p: Palette): Promise<void> {
  return new Promise((r) => chrome.storage.local.set({ [KEY]: p }, () => r()));
}

async function pick() {
  // EyeDropper API: only available on chromium
  const Eye = (
    window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } }
  ).EyeDropper;
  if (!Eye) {
    alert("EyeDropper not supported in this browser");
    return;
  }
  const e = new Eye();
  const res = await e.open();
  const palette = await load();
  await save(addSwatch(palette, res.sRGBHex));
  render();
}

async function render() {
  const palette = await load();
  const root = document.getElementById("swatches")!;
  root.innerHTML = "";
  for (const s of palette.swatches) {
    const div = document.createElement("div");
    div.style.cssText = `display:flex;align-items:center;gap:8px;padding:4px 0;`;
    const sw = document.createElement("span");
    sw.style.cssText = `width:24px;height:24px;display:inline-block;border:1px solid #ccc;background:${s.hex}`;
    const lbl = document.createElement("span");
    const onBlack = contrast(hexToRgb(s.hex), { r: 0, g: 0, b: 0 });
    const onWhite = contrast(hexToRgb(s.hex), { r: 255, g: 255, b: 255 });
    lbl.textContent = `${s.hex}  •  black ${onBlack} (${wcagLevel(onBlack)})  •  white ${onWhite} (${wcagLevel(onWhite)})`;
    lbl.style.fontFamily = "ui-monospace, monospace";
    lbl.style.fontSize = "11px";
    div.append(sw, lbl);
    root.appendChild(div);
  }
  document.getElementById("css")!.textContent = toCssVariables(palette);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("pick")?.addEventListener("click", pick);
  render();
});
