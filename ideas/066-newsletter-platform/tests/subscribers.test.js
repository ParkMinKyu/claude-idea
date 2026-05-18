import { describe, it, expect } from 'vitest';
import {
  makeUnsubscribeToken,
  verifyUnsubscribeToken,
  listUnsubscribeHeader,
} from '../src/subscribers.js';

describe('unsubscribe tokens', () => {
  it('produces a stable 24-char token', () => {
    const a = makeUnsubscribeToken('nl_1', 'foo@example.com');
    const b = makeUnsubscribeToken('nl_1', 'FOO@example.com');
    expect(a).toHaveLength(24);
    expect(a).toBe(b);
  });

  it('verifies valid tokens and rejects forged ones', () => {
    const t = makeUnsubscribeToken('nl_1', 'a@b.com');
    expect(verifyUnsubscribeToken('nl_1', 'a@b.com', t)).toBe(true);
    expect(verifyUnsubscribeToken('nl_1', 'a@b.com', 'x'.repeat(24))).toBe(false);
    expect(verifyUnsubscribeToken('nl_2', 'a@b.com', t)).toBe(false);
  });

  it('builds RFC 8058 one-click List-Unsubscribe headers', () => {
    const h = listUnsubscribeHeader({
      baseUrl: 'https://nl.example.com',
      newsletterId: 'nl_1',
      email: 'reader@example.com',
    });
    expect(h['List-Unsubscribe']).toMatch(/^<https:\/\/nl\.example\.com\/u\?/);
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });
});
