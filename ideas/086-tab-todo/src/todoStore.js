// Pure domain logic for Tab Todo extension.
// Storage adapter is injected so we can test without chrome.storage.

export function createStore(adapter) {
  return {
    async list() {
      const { todos = [] } = await adapter.get(["todos"]);
      return todos;
    },
    async add(text, opts = {}) {
      const todos = await this.list();
      const todo = {
        id: opts.id ?? cryptoRandom(),
        text: text.trim(),
        done: false,
        createdAt: opts.now ?? Date.now(),
        repeatDays: opts.repeatDays ?? 0, // bitmask: 1=Mon..64=Sun
      };
      if (!todo.text) throw new Error("empty todo");
      todos.unshift(todo);
      await adapter.set({ todos });
      return todo;
    },
    async toggle(id) {
      const todos = await this.list();
      const next = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      await adapter.set({ todos: next });
      return next.find((t) => t.id === id);
    },
    async remove(id) {
      const todos = await this.list();
      await adapter.set({ todos: todos.filter((t) => t.id !== id) });
    },
    async rollover(now = new Date()) {
      // At midnight: re-open repeating todos for today, drop one-off completed.
      const todos = await this.list();
      const dayBit = 1 << ((now.getDay() + 6) % 7); // Mon=1..Sun=64
      const next = todos
        .filter((t) => !(t.done && t.repeatDays === 0))
        .map((t) => {
          if (t.done && (t.repeatDays & dayBit) !== 0) {
            return { ...t, done: false };
          }
          return t;
        });
      await adapter.set({ todos: next });
      return next;
    },
  };
}

export function todayView(todos, limit = 5) {
  const active = todos.filter((t) => !t.done);
  return {
    visible: active.slice(0, limit),
    overflow: Math.max(0, active.length - limit),
    completedToday: todos.filter((t) => t.done).length,
  };
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10);
}

// In-memory adapter for tests / fallback.
export function memoryAdapter(initial = {}) {
  let state = { ...initial };
  return {
    async get(keys) {
      const out = {};
      for (const k of keys) out[k] = state[k];
      return out;
    },
    async set(patch) {
      state = { ...state, ...patch };
    },
    _state: () => state,
  };
}
