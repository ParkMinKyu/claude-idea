// Next.js App Router API: app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { summarizeMeeting, toMarkdown } from "./summarizer";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (typeof transcript !== "string" || transcript.trim().length < 20) {
      return NextResponse.json(
        { error: "transcript too short" },
        { status: 400 }
      );
    }
    const result = await summarizeMeeting(transcript);
    return NextResponse.json({
      ...result,
      markdown: toMarkdown(result),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
