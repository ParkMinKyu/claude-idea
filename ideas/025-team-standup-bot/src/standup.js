// Standup bot core: schedule resolver, response aggregation, Slack Block Kit builders.

const DAY_NUMS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

// Returns next Date when the standup should fire, given config.
// schedule = { time: "10:00", weekdays: ["mon","tue","wed","thu","fri"], tz: "Asia/Seoul" }
// We ignore TZ for tests by returning Date in caller's local — production wraps with luxon.
export function nextRunAt(schedule, now = new Date()) {
  const [h, m] = schedule.time.split(":").map(Number);
  const allowed = new Set(schedule.weekdays.map((d) => DAY_NUMS[d.toLowerCase()]));
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(h, m, 0, 0);
    if (i === 0 && candidate <= now) continue;
    if (allowed.has(candidate.getDay())) return candidate;
  }
  return null;
}

// Filter members who should receive a standup today, considering vacations.
// vacations = [{ userId, from: iso, to: iso }]
export function activeMembers(members, vacations, on = new Date()) {
  const onTs = on.getTime();
  const offToday = new Set(
    (vacations ?? [])
      .filter((v) => Date.parse(v.from) <= onTs && onTs <= Date.parse(v.to))
      .map((v) => v.userId),
  );
  return members.filter((m) => !offToday.has(m.userId) && m.active !== false);
}

// Compose Slack Block Kit message for the standup DM.
export function buildPromptBlocks(questions) {
  if (!Array.isArray(questions) || questions.length === 0) throw new Error("questions required");
  const blocks = [{ type: "header", text: { type: "plain_text", text: "오늘의 스탠드업" } }];
  questions.forEach((q, i) => {
    blocks.push({
      type: "input",
      block_id: `q_${i}`,
      label: { type: "plain_text", text: q },
      element: { type: "plain_text_input", action_id: "answer", multiline: true },
    });
  });
  blocks.push({
    type: "actions",
    elements: [
      { type: "button", text: { type: "plain_text", text: "제출" }, style: "primary", action_id: "submit" },
      { type: "button", text: { type: "plain_text", text: "오늘 패스" }, action_id: "skip" },
    ],
  });
  return blocks;
}

export function summarizeResponses(standup, responses) {
  const byUser = new Map(responses.map((r) => [r.userId, r]));
  const lines = standup.members.map((m) => {
    const r = byUser.get(m.userId);
    if (!r) return `• <@${m.userId}> — 미응답`;
    const ans = standup.questions
      .map((q, i) => `*${q}*\n${r.answers[i] ?? "_(빈 답)_"}`)
      .join("\n");
    return `• <@${m.userId}>\n${ans}`;
  });
  const responseRate = standup.members.length === 0 ? 0 : Math.round((byUser.size / standup.members.length) * 100);
  return {
    text: `*스탠드업 요약 (${responseRate}% 응답)*\n\n${lines.join("\n\n")}`,
    responseRate,
    missingUsers: standup.members.filter((m) => !byUser.has(m.userId)).map((m) => m.userId),
  };
}
