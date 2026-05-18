// Parse `- [ ] @user (due: YYYY-MM-DD) text` lines into structured actions.

const RE = /^- \[( |x|X)\]\s+(?:@(\S+)\s+)?(?:\(due:\s*([0-9-]+)\)\s+)?(.+)$/;

export function parseActions(markdown) {
  const out = [];
  const lines = markdown.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const m = line.match(RE);
    if (!m) return;
    const [, check, assignee, due, text] = m;
    out.push({
      done: check.toLowerCase() === "x",
      assignee: assignee ?? null,
      due: due ?? null,
      text: text.trim(),
      line: idx + 1,
    });
  });
  return out;
}

export function summarize(actions) {
  const open = actions.filter((a) => !a.done);
  const overdue = open.filter((a) => a.due && a.due < today());
  const byAssignee = {};
  for (const a of open) {
    const k = a.assignee ?? "unassigned";
    byAssignee[k] = (byAssignee[k] ?? 0) + 1;
  }
  return { total: actions.length, open: open.length, overdue: overdue.length, byAssignee };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
