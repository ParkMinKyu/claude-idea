import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("clip", {
  list: () => ipcRenderer.invoke("list"),
  search: (q: string) => ipcRenderer.invoke("search", q),
  pin: (id: string, pinned: boolean) => ipcRenderer.invoke("pin", id, pinned),
  paste: (content: string) => ipcRenderer.invoke("paste", content),
});
