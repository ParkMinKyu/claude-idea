import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { description } = await req.json();
  if (!description || typeof description !== 'string') {
    return Response.json({ error: 'description required' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text:
          'You generate JavaScript-flavor regular expressions. Respond ONLY with strict JSON of shape ' +
          '{"pattern": string, "flags": string, "explanation": string}. Use minimal flags.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: `Generate a regex for: ${description}` }],
  });

  const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  try {
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'model output not JSON', raw: text }, { status: 502 });
  }
}
