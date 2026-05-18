// Subscriber token helpers. Each subscriber gets a per-newsletter token used
// in unsubscribe links + List-Unsubscribe header. We use HMAC over
// (newsletterId, email) so tokens are stable + verifiable without storage.

import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.NEWSLETTER_TOKEN_SECRET || 'dev-secret-do-not-use';

export function makeUnsubscribeToken(newsletterId, email) {
  if (!newsletterId || !email) throw new Error('newsletterId and email required');
  const h = createHmac('sha256', SECRET);
  h.update(`${newsletterId}:${email.toLowerCase().trim()}`);
  return h.digest('base64url').slice(0, 24);
}

export function verifyUnsubscribeToken(newsletterId, email, token) {
  if (typeof token !== 'string' || token.length !== 24) return false;
  const expected = makeUnsubscribeToken(newsletterId, email);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

// Build List-Unsubscribe header value per RFC 8058 (one-click).
export function listUnsubscribeHeader({ baseUrl, newsletterId, email }) {
  const token = makeUnsubscribeToken(newsletterId, email);
  const url = `${baseUrl}/u?n=${encodeURIComponent(newsletterId)}&e=${encodeURIComponent(email)}&t=${token}`;
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
