import { app, Tray, Menu, BrowserWindow, Notification, ipcMain, nativeImage } from "electron";
import path from "node:path";
import { PomodoroTimer } from "./timer";
import { Store } from "./store";

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let timer: PomodoroTimer | null = null;
let store: Store | null = null;
let currentLabel = "";
let phaseStartedAt = 0;

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: "Start Focus", click: () => start("") },
    { label: "Pause", click: () => timer?.pause() },
    { label: "Skip", click: () => timer?.skip() },
    { type: "separator" },
    { label: "Stats", click: () => win?.show() },
    { type: "separator" },
    { label: "Quit", role: "quit" },
  ]);
}

function start(label: string) {
  currentLabel = label;
  phaseStartedAt = Date.now();
  timer?.start(label);
}

app.whenReady().then(() => {
  store = new Store(app.getPath("userData"));
  timer = new PomodoroTimer();
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Pomodoro: idle");
  tray.setContextMenu(buildMenu());

  timer.on("tick", ({ remaining, phase }) => {
    const m = Math.ceil(remaining / 60000);
    tray?.setTitle(`${phase[0].toUpperCase()} ${m}m`);
  });
  timer.on("phase-end", ({ phase, label, at }) => {
    if (phase === "focus") {
      store?.append({ label, startedAt: phaseStartedAt, endedAt: at });
    }
    new Notification({
      title: phase === "focus" ? "Focus done — take a break" : "Break over — back to focus",
    }).show();
  });
  timer.on("phase-start", () => {
    phaseStartedAt = Date.now();
  });

  win = new BrowserWindow({
    width: 480,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "../../src/renderer/index.html"));

  ipcMain.handle("start", (_e, label: string) => start(label));
  ipcMain.handle("pause", () => timer?.pause());
  ipcMain.handle("skip", () => timer?.skip());
  ipcMain.handle("stats", () => store?.load() ?? []);
});

app.on("window-all-closed", () => {});
