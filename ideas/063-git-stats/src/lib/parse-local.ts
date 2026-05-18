import simpleGit from 'simple-git';
import type { Commit } from './stats';

export interface ParseOptions {
  since?: string;
  until?: string;
  branch?: string;
}

/**
 * Parse commits from a local .git folder. Works for ANY repo cloned from
 * GitHub, Bitbucket, GitLab, Gitea, or purely local — provider-agnostic.
 */
export async function parseLocalRepo(repoPath: string, opts: ParseOptions = {}): Promise<Commit[]> {
  const git = simpleGit(repoPath);
  const args = [
    'log',
    '--numstat',
    '--date=iso-strict',
    '--pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI',
  ];
  if (opts.branch) args.push(opts.branch);
  if (opts.since) args.push(`--since=${opts.since}`);
  if (opts.until) args.push(`--until=${opts.until}`);
  const raw = await git.raw(args);
  return parseGitLog(raw);
}

/**
 * Pure parser for `git log --numstat --pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI`.
 * Exposed for testing without a real git repo.
 */
export function parseGitLog(raw: string): Commit[] {
  const commits: Commit[] = [];
  let current: Commit | null = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('COMMIT\x1f')) {
      if (current) commits.push(current);
      const [, hash, author, email, date] = line.split('\x1f');
      current = {
        hash,
        author,
        email,
        date,
        filesChanged: [],
        additions: 0,
        deletions: 0,
      };
      continue;
    }
    if (!line.trim() || !current) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const [added, deleted, ...fileParts] = parts;
    const file = fileParts.join('\t');
    if (!file) continue;
    current.filesChanged.push(file);
    // binary files report '-' for added/deleted
    current.additions = (current.additions ?? 0) + (added === '-' ? 0 : parseInt(added, 10) || 0);
    current.deletions = (current.deletions ?? 0) + (deleted === '-' ? 0 : parseInt(deleted, 10) || 0);
  }
  if (current) commits.push(current);
  return commits;
}
