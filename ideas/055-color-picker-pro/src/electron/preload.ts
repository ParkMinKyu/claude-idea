import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cpp", {
  add: (hex: string) => ipcRenderer.invoke("palette.add", hex),
  list: () => ipcRenderer.invoke("palette.list"),
  onPick: (cb: () => void) => ipcRenderer.on("trigger-pick", cb),
});
