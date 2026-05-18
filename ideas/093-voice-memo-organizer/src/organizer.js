// Pipeline: transcript -> Claude summary -> structured memo.
// All external calls are injected so tests run offline.

export function buildPrompt(transcript) {
  return `You are summarizing a voice memo. Respond ONLY with JSON of shape:
{"summary": "1-2 sentence summary", "tasks": ["..."], "tags": ["..."]}
Use the same language as the input. Keep tasks actionable.

Transcript:
"""
${transcript.trim()}
"""`;
}

export function parseClaudeJson(text) {
  // Tolerant parser: strip ```json fences if present.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  let obj;
  try {
    obj = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("invalid JSON from model: " + err.message);
  }
  if (typeof obj.summary !== "string") throw new Error("missing summary");
  if (!Array.isArray(obj.tasks)) obj.tasks = [];
  if (!Array.isArray(obj.tags)) obj.tags = [];
  return {
    summary: obj.summary.trim(),
    tasks: obj.tasks.map((t) => String(t).trim()).filter(Boolean),
    tags: obj.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean),
  };
}

export async function organize({ audio, whisper, claude }) {
  const transcript = await whisper(audio);
  const reply = await claude(buildPrompt(transcript));
  const parsed = parseClaudeJson(reply);
  return { transcript, ...parsed };
}

export function estimateCostUsd({ audioSeconds, transcriptTokens, summaryTokens }) {
  // Approximate, for billing display only.
  const whisperUsd = (audioSeconds / 60) * 0.006;
  const inputUsd = (transcriptTokens / 1_000_000) * 3.0;
  const outputUsd = (summaryTokens / 1_000_000) * 15.0;
  return Math.round((whisperUsd + inputUsd + outputUsd) * 10000) / 10000;
}

export function toMarkdown(memo, { title = "Voice memo" } = {}) {
  const tasks = memo.tasks.map((t) => `- [ ] ${t}`).join("\n");
  const tags = memo.tags.length ? `\nTags: ${memo.tags.map((t) => `#${t}`).join(" ")}` : "";
  return `# ${title}\n\n## Summary\n${memo.summary}\n\n## Tasks\n${tasks || "_(none)_"}\n\n## Transcript\n${memo.transcript}${tags}\n`;
}
