import { describe, it, expect } from 'vitest';
import { parseCron, encodeShare, decodeShare } from '../src/lib/cron';

describe('parseCron', () => {
  it('parses a valid expression', () => {
    const r = parseCron('*/15 * * * 1-5', { count: 3, tz: 'UTC' });
    expect(r.valid).toBe(true);
    expect(r.nextRuns).toHaveLength(3);
    expect(r.description).toBeTruthy();
  });

  it('rejects invalid expressions', () => {
    const r = parseCron('not a cron');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('returns ordered ascending next runs', () => {
    const r = parseCron('0 * * * *', { count: 4 });
    const ts = r.nextRuns!.map((s) => Date.parse(s));
    for (let i = 1; i < ts.length; i += 1) expect(ts[i]).toBeGreaterThan(ts[i - 1]);
  });
});

describe('share encoding', () => {
  it('round-trips', () => {
    const t = encodeShare('0 9 * * 1', 'Asia/Seoul');
    expect(decodeShare(t)).toEqual({ expression: '0 9 * * 1', tz: 'Asia/Seoul' });
  });

  it('returns null on garbage', () => {
    expect(decodeShare('!!!not-base64!!!')).toBeNull();
  });
});
