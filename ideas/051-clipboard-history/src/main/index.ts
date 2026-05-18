import { app, BrowserWindow, Tray, globalShortcut, clipboard, nativeImage, ipcMain } from "electron";
import path from "node:path";
import { ClipboardWatcher, isLikelySecret } from "./clipboard-watcher";
import { ClipDB } from "./db";
import { search, SnippetEntry } from "./search";

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let db: ClipDB | null = null;

function makeWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 540,
    frame: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "../../src/renderer/index.html"));
  win.on("blur", () => win?.hide());
}

function toggle() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else win.show();
}

app.whenReady().then(() => {
  db = new ClipDB(path.join(app.getPath("userData"), "data.db"));
  makeWindow();
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Clipboard History");
  tray.on("click", toggle);

  const watcher = new ClipboardWatcher({
    readText: () => clipboard.readText(),
    readImage: () => clipboard.readImage(),
  });
  watcher.on("item", (item) => {
    if (item.type === "text" && isLikelySecret(item.content)) return;
    db?.insert({
      id: `${item.capturedAt}-${item.hash}`,
      ...item,
    });
  });
  watcher.start();

  globalShortcut.register("CommandOrControl+Shift+V", toggle);

  ipcMain.handle("list", () => db?.recent(200) ?? []);
  ipcMain.handle("search", (_e, q: string) => {
    const entries = (db?.recent(500) ?? []) as SnippetEntry[];
    return search(entries, q);
  });
  ipcMain.handle("pin", (_e, id: string, pinned: boolean) => db?.pin(id, pinned));
  ipcMain.handle("paste", (_e, content: string) => {
    clipboard.writeText(content);
    win?.hide();
  });
});

app.on("will-quit", () => globalShortcut.unregisterAll());
