import { app, globalShortcut, Tray, Menu, screen, nativeImage } from "electron";
import { computeBounds, LayoutId, Rect } from "./layouts";
import { DEFAULT_SHORTCUTS } from "./shortcuts";
import { StubAdapter, WindowAdapter } from "./adapter";

let tray: Tray | null = null;
const adapter: WindowAdapter = new StubAdapter();

function pickDisplay(bounds: Rect | null): Rect {
  const all = screen.getAllDisplays().map((d) => d.workArea);
  if (!bounds) return all[0];
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return (
    all.find((d) => cx >= d.x && cx < d.x + d.width && cy >= d.y && cy < d.y + d.height) ??
    all[0]
  );
}

async function apply(layout: LayoutId) {
  const win = await adapter.getActiveWindowBounds();
  const display = pickDisplay(win);
  const target = computeBounds(layout, display);
  await adapter.setActiveWindowBounds(target);
}

function registerShortcuts() {
  for (const [accel, layout] of Object.entries(DEFAULT_SHORTCUTS)) {
    globalShortcut.register(accel, () => apply(layout));
  }
}

app.whenReady().then(() => {
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Window Manager");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Left Half", click: () => apply("left-half") },
      { label: "Right Half", click: () => apply("right-half") },
      { label: "Center", click: () => apply("center") },
      { label: "Fullscreen", click: () => apply("fullscreen") },
      { type: "separator" },
      { label: "Quit", role: "quit" },
    ])
  );
  registerShortcuts();
});

app.on("will-quit", () => globalShortcut.unregisterAll());
