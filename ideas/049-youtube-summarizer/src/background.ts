import { summarizeTranscript } from "./lib/summarize";
import { getSettings, pushHistory } from "./lib/storage";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "summarize") {
    (async () => {
      try {
        const settings = await getSettings();
        if (!settings.apiKey) {
          sendResponse({ ok: false, error: "API key not set. Open options." });
          return;
        }
        const result = await summarizeTranscript(
          settings.apiKey,
          msg.payload.transcript,
          settings.language
        );
        await pushHistory({
          videoId: msg.payload.videoId,
          title: msg.payload.title,
          at: Date.now(),
          tldr: result.tldr,
        });
        sendResponse({ ok: true, result });
      } catch (e) {
        sendResponse({ ok: false, error: (e as Error).message });
      }
    })();
    return true;
  }
});
