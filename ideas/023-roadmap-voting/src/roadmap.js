// Roadmap voting core: hot score, board columns, dedup voting, status transitions.

export const COLUMNS = ["backlog", "planned", "in_progress", "shipped"];

export function castVote(post, voterEmail) {
  if (!voterEmail || typeof voterEmail !== "string") throw new Error("voter email required");
  const voters = new Set(post.voters ?? []);
  const norm = voterEmail.trim().toLowerCase();
  if (voters.has(norm)) return { post, changed: false };
  voters.add(norm);
  return { post: { ...post, voters: [...voters] }, changed: true };
}

export function removeVote(post, voterEmail) {
  const norm = voterEmail.trim().toLowerCase();
  const voters = new Set(post.voters ?? []);
  if (!voters.has(norm)) return { post, changed: false };
  voters.delete(norm);
  return { post: { ...post, voters: [...voters] }, changed: true };
}

// Hacker-news style hot score: votes / (age_hours + 2)^1.5
export function hotScore(post, now = Date.now()) {
  const votes = (post.voters?.length ?? 0) + 1; // +1 for poster
  const ageHours = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3_600_000);
  return votes / Math.pow(ageHours + 2, 1.5);
}

export function rankPosts(posts, mode = "hot", now = Date.now()) {
  const arr = [...posts];
  if (mode === "top") {
    arr.sort((a, b) => (b.voters?.length ?? 0) - (a.voters?.length ?? 0));
  } else if (mode === "new") {
    arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    arr.sort((a, b) => hotScore(b, now) - hotScore(a, now));
  }
  return arr;
}

export function groupByColumn(posts) {
  const out = Object.fromEntries(COLUMNS.map((c) => [c, []]));
  for (const p of posts) {
    const col = COLUMNS.includes(p.status) ? p.status : "backlog";
    out[col].push(p);
  }
  return out;
}

export function transitionStatus(post, toStatus) {
  if (!COLUMNS.includes(toStatus)) throw new Error("unknown status");
  return { ...post, status: toStatus, updatedAt: new Date().toISOString() };
}

// Determine recipients for status-change emails: all unique voters + author.
export function notifyRecipients(post) {
  const set = new Set((post.voters ?? []).map((v) => v.toLowerCase()));
  if (post.authorEmail) set.add(post.authorEmail.toLowerCase());
  return [...set];
}
