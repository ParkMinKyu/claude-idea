// Curated MDX templates. Each returns markdown given (ctx).

export const templates = {
  "1on1": (ctx) => `# 1:1 with @${ctx.attendee ?? "teammate"} — ${ctx.date}

## How are you doing?
-

## What's blocking you?
-

## Wins this week
-

## Action items
- [ ] @${ctx.attendee ?? "teammate"} (due: ${nextWeek(ctx.date)}) follow up on …
`,

  retro: (ctx) => `# Sprint ${ctx.sprint ?? "X"} Retro — ${ctx.date}

## What went well
-

## What didn't go well
-

## Try next sprint
-

## Action items
- [ ] @owner (due: ${nextWeek(ctx.date)}) experiment with …
`,

  kickoff: (ctx) => `# ${ctx.project ?? "Project"} Kickoff — ${ctx.date}

## Goal
> One sentence.

## Non-goals
-

## Milestones
| Date | Milestone |
|---|---|
| ${ctx.date} | Kickoff |

## Action items
- [ ] @pm (due: ${nextWeek(ctx.date)}) finalize scope
`,

  external: (ctx) => `# Meeting with ${ctx.company ?? "Vendor"} — ${ctx.date}

## Attendees
-

## Notes
-

## Decisions
-

## Action items
- [ ] @owner (due: ${nextWeek(ctx.date)}) send follow-up
`,
};

export function renderTemplate(type, ctx = {}) {
  const tpl = templates[type];
  if (!tpl) throw new Error(`unknown template: ${type}`);
  return tpl({ date: new Date().toISOString().slice(0, 10), ...ctx });
}

function nextWeek(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
