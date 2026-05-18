import { app, BrowserWindow, globalShortcut, Tray, nativeImage, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { addSwatch, Palette } from "../lib/palette";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let palette: Palette = { id: "default", name: "Default", swatches: [] };
let saveFile = "";

function load(): Palette {
  try {
    return JSON.parse(fs.readFileSync(saveFile, "utf8")) as Palette;
  } catch {
    return { id: "default", name: "Default", swatches: [] };
  }
}
function save() {
  fs.writeFileSync(saveFile, JSON.stringify(palette));
}

app.whenReady().then(() => {
  saveFile = path.join(app.getPath("userData"), "palette.json");
  palette = load();
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Color Picker Pro");

  win = new BrowserWindow({
    width: 360,
    height: 480,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "../../src/electron/renderer/index.html"));

  globalShortcut.register("CommandOrControl+Shift+P", () => {
    win?.webContents.send("trigger-pick");
    win?.show();
  });

  ipcMain.handle("palette.add", (_e, hex: string) => {
    palette = addSwatch(palette, hex);
    save();
    return palette;
  });
  ipcMain.handle("palette.list", () => palette);
});

app.on("will-quit", () => globalShortcut.unregisterAll());
