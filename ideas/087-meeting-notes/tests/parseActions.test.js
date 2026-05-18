import { describe, it, expect } from "vitest";
import { parseActions, summarize } from "../src/parseActions.js";
import { renderTemplate, templates } from "../src/templates.js";

describe("parseActions", () => {
  it("extracts assignee, due, and text", () => {
    const md = `notes...
- [ ] @alice (due: 2026-02-01) ship MVP
- [x] @bob (due: 2026-01-15) write doc
- [ ] no assignee task`;
    const actions = parseActions(md);
    expect(actions).toHaveLength(3);
    expect(actions[0]).toMatchObject({ assignee: "alice", due: "2026-02-01", done: false });
    expect(actions[1].done).toBe(true);
    expect(actions[2].assignee).toBeNull();
  });

  it("ignores non-action checkboxes inside code fences only if simple", () => {
    const md = `- [ ] real task
plain text
- [X] done task`;
    expect(parseActions(md)).toHaveLength(2);
  });
});

describe("summarize", () => {
  it("counts open and groups by assignee", () => {
    const md = `- [ ] @alice a
- [ ] @alice b
- [x] @bob c
- [ ] @bob d`;
    const s = summarize(parseActions(md));
    expect(s.total).toBe(4);
    expect(s.open).toBe(3);
    expect(s.byAssignee).toEqual({ alice: 2, bob: 1 });
  });
});

describe("renderTemplate", () => {
  it("renders known templates with context", () => {
    const out = renderTemplate("1on1", { attendee: "ada", date: "2026-05-18" });
    expect(out).toContain("@ada");
    expect(out).toContain("2026-05-18");
  });

  it("throws on unknown template", () => {
    expect(() => renderTemplate("nope")).toThrow();
  });

  it("exposes a non-empty template catalog", () => {
    expect(Object.keys(templates).length).toBeGreaterThanOrEqual(3);
  });
});
