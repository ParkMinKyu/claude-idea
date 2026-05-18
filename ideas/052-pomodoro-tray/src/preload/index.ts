import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("pomo", {
  start: (label: string) => ipcRenderer.invoke("start", label),
  pause: () => ipcRenderer.invoke("pause"),
  skip: () => ipcRenderer.invoke("skip"),
  stats: () => ipcRenderer.invoke("stats"),
});
