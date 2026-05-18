import { speak, SpeechController } from "./lib/speech";

let controller: SpeechController | null = null;

async function getText(): Promise<{ title: string; text: string } | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({ title: document.title, text: document.body.innerText }),
  });
  return result as { title: string; text: string };
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("play")?.addEventListener("click", async () => {
    const data = await getText();
    if (!data) return;
    const rate = Number((document.getElementById("rate") as HTMLInputElement).value);
    controller?.stop();
    controller = speak(data.text, { rate });
  });
  document.getElementById("pause")?.addEventListener("click", () => controller?.pause());
  document.getElementById("resume")?.addEventListener("click", () => controller?.resume());
  document.getElementById("stop")?.addEventListener("click", () => controller?.stop());
  document.getElementById("queue")?.addEventListener("click", async () => {
    const data = await getText();
    if (!data) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({
      type: "queue.add",
      payload: { url: tab?.url ?? "", title: data.title },
    });
  });
});
