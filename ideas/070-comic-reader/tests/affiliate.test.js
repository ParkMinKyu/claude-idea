import { describe, it, expect } from 'vitest';
import { buildAffiliateLink, hashUserId, supportedPlatforms } from '../src/affiliate.js';

describe('buildAffiliateLink', () => {
  it('throws on unknown platform', () => {
    expect(() => buildAffiliateLink({ platform: 'nope', externalId: '1' })).toThrow();
  });
  it('requires externalId', () => {
    expect(() => buildAffiliateLink({ platform: 'naver' })).toThrow();
  });
  it('embeds our partner code', () => {
    const url = new URL(buildAffiliateLink({ platform: 'naver', externalId: '777' }));
    expect(url.searchParams.get('utm_source')).toBe('recohub');
    expect(url.pathname).toContain('777');
  });
  it('includes hashed user sub when userId provided', () => {
    const url = new URL(buildAffiliateLink({ platform: 'kakao', externalId: '42', userId: 'u_1' }));
    expect(url.searchParams.get('sub')).toMatch(/^[0-9a-f]{16}$/);
    expect(url.searchParams.get('sub')).not.toBe('u_1');
  });
});

describe('hashUserId', () => {
  it('produces stable 16-hex digest', () => {
    expect(hashUserId('u_1')).toBe(hashUserId('u_1'));
    expect(hashUserId('u_1')).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('supportedPlatforms', () => {
  it('lists the four onboarded platforms', () => {
    expect(supportedPlatforms().sort()).toEqual(['kakao', 'lezhin', 'naver', 'tapas']);
  });
});
