import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhook, mapAssetEvent, parseSignatureHeader } from '../src/webhook.js';

function sign(body, secret, ts) {
  return createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
}

describe('parseSignatureHeader', () => {
  it('parses t + v1 fields', () => {
    const out = parseSignatureHeader('t=1747600000,v1=abc');
    expect(out).toEqual({ ts: 1747600000, signature: 'abc' });
  });
  it('returns null on bad header', () => {
    expect(parseSignatureHeader('')).toBeNull();
    expect(parseSignatureHeader('v1=abc')).toBeNull();
  });
});

describe('verifyWebhook', () => {
  const secret = 's3cret';
  const body = '{"hi":1}';
  const now = 1_747_600_000_000; // ms
  const ts = Math.floor(now / 1000);

  it('accepts valid signature', () => {
    const header = `t=${ts},v1=${sign(body, secret, ts)}`;
    expect(verifyWebhook({ rawBody: body, header, secret, now })).toEqual({ ok: true });
  });

  it('rejects wrong secret', () => {
    const header = `t=${ts},v1=${sign(body, 'wrong', ts)}`;
    const r = verifyWebhook({ rawBody: body, header, secret, now });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('mismatch');
  });

  it('rejects stale timestamps', () => {
    const header = `t=${ts - 999},v1=${sign(body, secret, ts - 999)}`;
    expect(verifyWebhook({ rawBody: body, header, secret, now, toleranceSeconds: 60 }).reason).toBe('stale');
  });
});

describe('mapAssetEvent', () => {
  it('maps ready event', () => {
    const m = mapAssetEvent({
      type: 'video.asset.ready',
      data: { id: 'a1', playback_ids: [{ id: 'pb1' }], duration: 20 },
    });
    expect(m).toMatchObject({ kind: 'ready', assetId: 'a1', playbackId: 'pb1', durationSeconds: 20 });
  });
  it('maps errored event', () => {
    const m = mapAssetEvent({
      type: 'video.asset.errored',
      data: { id: 'a1', errors: { messages: ['bad input'] } },
    });
    expect(m).toMatchObject({ kind: 'errored', errorMessage: 'bad input' });
  });
  it('ignores unknown types', () => {
    expect(mapAssetEvent({ type: 'video.live.started' }).kind).toBe('ignored');
  });
});
