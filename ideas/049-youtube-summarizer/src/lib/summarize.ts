import Anthropic from "@anthropic-ai/sdk";

export interface Chapter {
  title: string;
  startSeconds: number;
}

export interface SummaryResult {
  tldr: string;
  chapters: Chapter[];
  quotes: string[];
}

const SYSTEM = `You summarize YouTube transcripts.
Always respond as JSON matching this shape exactly:
{
  "tldr": string (3-5 sentences),
  "chapters": [{ "title": string, "startSeconds": number }],
  "quotes": [string]
}
Pick at most 8 chapters and 5 quotes. Use timestamps that appear in [HH:MM:SS] or [MM:SS] markers in the transcript.`;

export function timestampToSeconds(s: string): number {
  const parts = s.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export async function summarizeTranscript(
  apiKey: string,
  transcript: string,
  language = "ko"
): Promise<SummaryResult> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Output language: ${language}.\n\nTranscript:\n${transcript}`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  return parseSummary(text);
}

export function parseSummary(raw: string): SummaryResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("no JSON in response");
  const obj = JSON.parse(jsonMatch[0]) as Partial<SummaryResult>;
  return {
    tldr: String(obj.tldr ?? ""),
    chapters: Array.isArray(obj.chapters)
      ? obj.chapters.map((c) => ({
          title: String((c as Chapter).title ?? ""),
          startSeconds: Number((c as Chapter).startSeconds ?? 0),
        }))
      : [],
    quotes: Array.isArray(obj.quotes) ? obj.quotes.map(String) : [],
  };
}
