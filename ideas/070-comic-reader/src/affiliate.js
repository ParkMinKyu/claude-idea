// Build an affiliate deep link to an external platform with our partner code
// + a hashed user id so we can attribute conversions without leaking PII.

import { createHash } from 'node:crypto';

const PLATFORMS = {
  naver: { base: 'https://comic.naver.com/webtoon/list', paramKey: 'utm_source', code: 'recohub' },
  kakao: { base: 'https://webtoon.kakao.com/content', paramKey: 'pcode', code: 'recohub' },
  lezhin: { base: 'https://www.lezhin.com/ko/comic', paramKey: 'utm_campaign', code: 'recohub' },
  tapas: { base: 'https://tapas.io/series', paramKey: 'utm_source', code: 'recohub' },
};

export function hashUserId(userId) {
  if (!userId) return '';
  return createHash('sha256').update(`recohub:${userId}`).digest('hex').slice(0, 16);
}

export function buildAffiliateLink({ platform, externalId, userId }) {
  const cfg = PLATFORMS[platform];
  if (!cfg) throw new Error(`unknown platform: ${platform}`);
  if (!externalId) throw new Error('externalId required');
  const url = new URL(`${cfg.base}/${encodeURIComponent(externalId)}`);
  url.searchParams.set(cfg.paramKey, cfg.code);
  if (userId) url.searchParams.set('sub', hashUserId(userId));
  return url.toString();
}

export function supportedPlatforms() {
  return Object.keys(PLATFORMS);
}
