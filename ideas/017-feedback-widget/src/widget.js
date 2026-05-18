// Embeddable feedback widget — zero dependency, Shadow DOM isolated.
// Bundled (esbuild --minify --format=iife --target=es2020) for CDN delivery.

export function createWidget({ apiKey, endpoint = "https://api.fb.example/v1/feedback", doc = document } = {}) {
  if (!apiKey) throw new Error("apiKey is required");
  const host = doc.createElement("div");
  host.setAttribute("data-fb-widget", "");
  const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  const button = doc.createElement("button");
  button.textContent = "Feedback";
  button.style.cssText = "position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:9999px;background:#111;color:#fff;border:0;cursor:pointer;font:14px sans-serif;z-index:2147483647";

  const panel = doc.createElement("form");
  panel.style.cssText = "position:fixed;bottom:70px;right:20px;width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;display:none;box-shadow:0 10px 30px rgba(0,0,0,.08);font:14px sans-serif;z-index:2147483647";
  panel.innerHTML = `
    <label style="display:block;margin-bottom:6px">평가</label>
    <select name="rating" required style="width:100%;margin-bottom:10px;padding:6px">
      <option value="">선택</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
    </select>
    <label style="display:block;margin-bottom:6px">의견</label>
    <textarea name="message" required rows="4" style="width:100%;margin-bottom:10px;padding:6px"></textarea>
    <button type="submit" style="width:100%;padding:8px;background:#111;color:#fff;border:0;border-radius:6px;cursor:pointer">보내기</button>
    <div data-status style="margin-top:8px;font-size:12px;color:#16a34a"></div>
  `;

  button.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  panel.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(panel);
    const payload = {
      rating: Number(data.get("rating")),
      message: String(data.get("message")),
      url: doc.location?.href,
      userAgent: globalThis.navigator?.userAgent,
      ts: Date.now(),
    };
    const status = panel.querySelector("[data-status]");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      status.textContent = "감사합니다!";
      panel.reset();
    } catch (err) {
      status.style.color = "#dc2626";
      status.textContent = "전송 실패: " + err.message;
    }
  });

  root.appendChild(button);
  root.appendChild(panel);
  doc.body.appendChild(host);
  return { host, destroy: () => host.remove() };
}

export function validatePayload(p) {
  if (typeof p !== "object" || !p) return "invalid";
  if (!Number.isInteger(p.rating) || p.rating < 1 || p.rating > 5) return "rating must be 1..5";
  if (typeof p.message !== "string" || p.message.length < 1 || p.message.length > 5000) return "message length";
  return null;
}

if (typeof window !== "undefined" && document.currentScript) {
  const key = document.currentScript.getAttribute("data-key");
  if (key) createWidget({ apiKey: key });
}
