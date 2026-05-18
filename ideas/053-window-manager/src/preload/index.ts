import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("wm", {
  apply: (layout: string) => ipcRenderer.invoke("apply", layout),
});
