import { describe, it, expect } from "vitest";
import { createStore, todayView, memoryAdapter } from "../src/todoStore.js";

describe("createStore", () => {
  it("adds and lists todos", async () => {
    const s = createStore(memoryAdapter());
    await s.add("write tests");
    await s.add("ship MVP");
    const todos = await s.list();
    expect(todos).toHaveLength(2);
    expect(todos[0].text).toBe("ship MVP");
  });

  it("rejects empty todos", async () => {
    const s = createStore(memoryAdapter());
    await expect(s.add("   ")).rejects.toThrow();
  });

  it("toggles done state", async () => {
    const s = createStore(memoryAdapter());
    const t = await s.add("focus");
    await s.toggle(t.id);
    const list = await s.list();
    expect(list[0].done).toBe(true);
  });

  it("rolls over repeating todos on a matching weekday", async () => {
    const adapter = memoryAdapter();
    const s = createStore(adapter);
    const t = await s.add("review", { repeatDays: 0b1111111 });
    await s.toggle(t.id);
    // Monday => bit 1
    await s.rollover(new Date("2024-01-01T00:01:00Z"));
    const list = await s.list();
    expect(list[0].done).toBe(false);
  });

  it("drops completed one-off todos on rollover", async () => {
    const s = createStore(memoryAdapter());
    const t = await s.add("buy milk");
    await s.toggle(t.id);
    await s.rollover(new Date());
    expect(await s.list()).toHaveLength(0);
  });
});

describe("todayView", () => {
  it("limits visible todos and reports overflow", () => {
    const todos = Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, text: `t${i}`, done: false }));
    const v = todayView(todos, 5);
    expect(v.visible).toHaveLength(5);
    expect(v.overflow).toBe(3);
  });

  it("excludes done todos from visible", () => {
    const todos = [
      { id: "a", text: "a", done: true },
      { id: "b", text: "b", done: false },
    ];
    const v = todayView(todos, 5);
    expect(v.visible.map((t) => t.id)).toEqual(["b"]);
    expect(v.completedToday).toBe(1);
  });
});
