import { extractVideoId, parseJson3, parseXml, cuesToText } from "./lib/transcript";

async function fetchTranscript(videoId: string, lang = "en"): Promise<string> {
  const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
  const res = await fetch(url);
  const text = await res.text();
  if (!text.trim()) return "";
  try {
    const cues = parseJson3(JSON.parse(text));
    return cuesToText(cues);
  } catch {
    return cuesToText(parseXml(text));
  }
}

function injectButton() {
  if (document.getElementById("yts-btn")) return;
  const btn = document.createElement("button");
  btn.id = "yts-btn";
  btn.textContent = "Summarize";
  btn.style.cssText =
    "padding:8px 12px;margin:8px;background:#cc0000;color:#fff;border:0;border-radius:18px;cursor:pointer;";
  btn.onclick = async () => {
    const id = extractVideoId(location.href);
    if (!id) return;
    btn.textContent = "Loading transcript...";
    const transcript = await fetchTranscript(id);
    if (!transcript) {
      btn.textContent = "No transcript available";
      return;
    }
    btn.textContent = "Summarizing...";
    chrome.runtime.sendMessage(
      {
        type: "summarize",
        payload: { videoId: id, title: document.title, transcript },
      },
      (resp) => {
        if (!resp?.ok) {
          btn.textContent = `Error: ${resp?.error ?? "unknown"}`;
        } else {
          alert(resp.result.tldr);
          btn.textContent = "Done";
        }
      }
    );
  };
  const target = document.querySelector("#above-the-fold") || document.body;
  target.prepend(btn);
}

const obs = new MutationObserver(() => injectButton());
obs.observe(document.body, { childList: true, subtree: true });
injectButton();
