declare global {
  interface Window {
    clip: {
      list(): Promise<Array<{ id: string; content: string; pinned?: number; type: string }>>;
      search(q: string): Promise<Array<{ id: string; content: string; pinned?: number; type: string }>>;
      paste(content: string): Promise<void>;
      pin(id: string, pinned: boolean): Promise<void>;
    };
  }
}

async function refresh() {
  const q = (document.getElementById("q") as HTMLInputElement).value;
  const list = q ? await window.clip.search(q) : await window.clip.list();
  const root = document.getElementById("results")!;
  root.innerHTML = "";
  for (const item of list) {
    const div = document.createElement("div");
    div.className = "item" + (item.pinned ? " pinned" : "");
    div.textContent = item.content.slice(0, 200);
    div.onclick = () => window.clip.paste(item.content);
    root.appendChild(div);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refresh();
  document.getElementById("q")?.addEventListener("input", refresh);
});

export {};
