import { extractAsin, parsePriceString } from "./lib/parse-price";

function injectTrackButton() {
  const asin = extractAsin(location.href);
  if (!asin) return;
  if (document.getElementById("pw-track-btn")) return;

  const priceEl =
    document.querySelector(".a-price .a-offscreen") ||
    document.querySelector("#priceblock_ourprice");
  const titleEl = document.querySelector("#productTitle");
  const price = priceEl?.textContent ? parsePriceString(priceEl.textContent) : null;
  const title = titleEl?.textContent?.trim() ?? document.title;

  const btn = document.createElement("button");
  btn.id = "pw-track-btn";
  btn.textContent = "Track price";
  btn.style.cssText =
    "padding:8px 14px;margin:8px 0;background:#ff9900;color:#fff;border:0;border-radius:4px;cursor:pointer;";
  btn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "track.add",
      payload: {
        asin,
        url: location.href.split("?")[0],
        title,
        currency: price?.currency ?? "USD",
        addedAt: Date.now(),
        history: price ? [{ at: Date.now(), amount: price.amount }] : [],
      },
    });
    btn.textContent = "Tracking ✓";
    btn.disabled = true;
  };
  const target = document.querySelector("#addToCart_feature_div") || document.body;
  target.prepend(btn);
}

if (document.readyState === "complete") injectTrackButton();
else window.addEventListener("load", injectTrackButton);
