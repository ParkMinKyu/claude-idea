import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySignature, planFromPayload, makeSlug } from '../src/webhook';
import { buildServer } from '../src/server';

describe('verifySignature', () => {
  const secret = 's3cret';
  const body = JSON.stringify({ hello: 'world' });
  const valid = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a valid signature', () => {
    expect(verifySignature(secret, valid, body)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifySignature(secret, valid, body + 'x')).toBe(false);
  });

  it('rejects missing or malformed header', () => {
    expect(verifySignature(secret, undefined, body)).toBe(false);
    expect(verifySignature(secret, 'md5=abc', body)).toBe(false);
  });
});

describe('planFromPayload', () => {
  const base = {
    number: 42,
    repository: { full_name: 'acme/web', clone_url: 'https://github.com/acme/web.git' },
    pull_request: { head: { sha: 'deadbeef', ref: 'feature/x' } },
  };

  it('emits a deploy plan for opened PRs', () => {
    const plan = planFromPayload({ ...base, action: 'opened' } as any, 'preview.test');
    expect(plan?.action).toBe('deploy');
    expect(plan?.hostname).toBe('pr-42-acme-web.preview.test');
  });

  it('emits a destroy plan for closed PRs', () => {
    const plan = planFromPayload({ ...base, action: 'closed' } as any, 'preview.test');
    expect(plan?.action).toBe('destroy');
  });

  it('ignores unsupported actions', () => {
    expect(planFromPayload({ ...base, action: 'labeled' } as any, 'preview.test')).toBeNull();
  });
});

describe('makeSlug', () => {
  it('sanitises uppercase and special chars', () => {
    expect(makeSlug('Acme/Web_API', 7)).toMatch(/^pr-7-acme-web-api$/);
  });
});

describe('server', () => {
  it('rejects bad signatures', async () => {
    const app = buildServer('s', 'preview.test');
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-hub-signature-256': 'sha256=bad', 'x-github-event': 'pull_request' },
      payload: { hello: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});
