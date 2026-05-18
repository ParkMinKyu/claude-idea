import { DEFAULT_CONFIG, SuspendConfig } from "./suspend-engine";

const KEY = "suspender.config";

export async function loadConfig(): Promise<SuspendConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEY, (data) => {
      resolve({ ...DEFAULT_CONFIG, ...(data[KEY] ?? {}) });
    });
  });
}

export async function saveConfig(cfg: SuspendConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [KEY]: cfg }, () => resolve());
  });
}
