import { createHmac, timingSafeEqual } from 'node:crypto';

export interface PullRequestPayload {
  action: 'opened' | 'synchronize' | 'closed' | 'reopened' | string;
  number: number;
  repository: { full_name: string; clone_url: string };
  pull_request: { head: { sha: string; ref: string } };
}

export interface DeploymentPlan {
  action: 'deploy' | 'destroy';
  slug: string;
  cloneUrl: string;
  ref: string;
  sha: string;
  hostname: string;
}

export function verifySignature(secret: string, sigHeader: string | undefined, body: string): boolean {
  if (!sigHeader || !sigHeader.startsWith('sha256=')) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(sigHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const SLUG_RE = /[^a-z0-9-]+/g;

export function makeSlug(repoFullName: string, prNumber: number): string {
  const repo = repoFullName.toLowerCase().replace('/', '-').replace(SLUG_RE, '-');
  return `pr-${prNumber}-${repo}`.slice(0, 50).replace(/-+$/g, '');
}

export function planFromPayload(p: PullRequestPayload, baseDomain: string): DeploymentPlan | null {
  const slug = makeSlug(p.repository.full_name, p.number);
  const hostname = `${slug}.${baseDomain}`;
  if (p.action === 'opened' || p.action === 'reopened' || p.action === 'synchronize') {
    return {
      action: 'deploy',
      slug,
      cloneUrl: p.repository.clone_url,
      ref: p.pull_request.head.ref,
      sha: p.pull_request.head.sha,
      hostname,
    };
  }
  if (p.action === 'closed') {
    return { action: 'destroy', slug, cloneUrl: p.repository.clone_url, ref: '', sha: '', hostname };
  }
  return null;
}
