import { createStore, todayView, memoryAdapter } from "./todoStore.js";

const adapter =
  typeof chrome !== "undefined" && chrome.storage?.sync
    ? chrome.storage.sync
    : memoryAdapter();

const store = createStore(adapter);

async function render() {
  const todos = await store.list();
  const view = todayView(todos);
  const ul = document.getElementById("list");
  ul.innerHTML = "";
  for (const t of view.visible) {
    const li = document.createElement("li");
    li.className = t.done ? "done" : "";
    li.textContent = t.text;
    li.tabIndex = 0;
    li.addEventListener("click", async () => {
      await store.toggle(t.id);
      render();
    });
    ul.appendChild(li);
  }
  if (view.overflow > 0) {
    const li = document.createElement("li");
    li.style.opacity = 0.4;
    li.textContent = `+ ${view.overflow}개 더`;
    ul.appendChild(li);
  }
}

document.getElementById("add").addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && e.target.value.trim()) {
    await store.add(e.target.value);
    e.target.value = "";
    render();
  }
});

render();
