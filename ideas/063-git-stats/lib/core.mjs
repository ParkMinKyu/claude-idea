// git-stats 공유 코어: git 로그 파싱 · 통계 집계 · HTML 렌더.
// CLI(bin/git-stats.mjs)와 로컬 서버(bin/serve.mjs)가 함께 사용한다.
// 의존성 0 — 시스템 `git` CLI만 필요.

import { execFileSync } from 'node:child_process';

// ─────────── git log 로딩 & 파싱 ───────────
export function parseGitLog(raw) {
  const commits = [];
  let current = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('COMMIT\x1f')) {
      if (current) commits.push(current);
      const parts = line.split('\x1f');
      const [, hash, author, email, date, ...rest] = parts;
      const subject = rest.join('\x1f');
      current = { hash, author, email, date, subject: subject ?? '', filesChanged: [], additions: 0, deletions: 0 };
      continue;
    }
    if (!line.trim() || !current) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const [added, deleted, ...fp] = parts;
    const file = fp.join('\t');
    if (!file) continue;
    current.filesChanged.push(file);
    current.additions += added === '-' ? 0 : parseInt(added, 10) || 0;
    current.deletions += deleted === '-' ? 0 : parseInt(deleted, 10) || 0;
  }
  if (current) commits.push(current);
  return commits;
}

/**
 * 저장소의 로컬 브랜치 목록과 현재 HEAD 브랜치를 반환.
 * { current: 'main', branches: ['main', 'dev', ...] }
 */
export function listBranches(repoPath) {
  let current = '';
  try {
    current = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    current = ''; // detached HEAD 등
  }
  let branches = [];
  try {
    const raw = execFileSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], {
      cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    branches = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error("system 'git' 명령을 찾을 수 없습니다.");
    branches = [];
  }
  // 현재 브랜치를 맨 앞으로.
  if (current && branches.includes(current)) {
    branches = [current, ...branches.filter((b) => b !== current)];
  }
  return { current, branches };
}

export function loadCommits(repoPath, opts = {}) {
  const args = ['log', '--numstat', '--date=iso-strict', '--pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI%x1f%s'];
  if (!opts.includeMerges) args.push('--no-merges');
  if (opts.all) args.push('--all');
  if (opts.branch) args.push(opts.branch);
  if (opts.since) args.push(`--since=${opts.since}`);
  if (opts.until) args.push(`--until=${opts.until}`);
  try {
    const raw = execFileSync('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return parseGitLog(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("system 'git' 명령을 찾을 수 없습니다. Git을 먼저 설치하세요: https://git-scm.com/downloads");
    }
    const stderr = err.stderr?.toString() ?? err.message ?? '';
    // 커밋이 하나도 없는 저장소(git init 직후 등)는 에러가 아니라 빈 결과로 다룬다.
    if (/does not have any commits yet|bad default revision|unknown revision or path not in the working tree/i.test(stderr)) {
      return [];
    }
    throw new Error(`git log 실패: ${stderr}`);
  }
}

// ─────────── 통계 ───────────
// KST = UTC+9. ISO 타임스탬프를 KST 요일/시간으로 변환.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export function kstParts(iso) {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}

export function byContributor(commits) {
  // 이메일(소문자) 기준 집계 — 같은 사람의 다른 별칭을 병합.
  const m = new Map();
  for (const c of commits) {
    const key = (c.email || c.author || '').toLowerCase();
    const cur = m.get(key) ?? {
      email: c.email ?? '',
      author: c.author ?? '',
      commits: 0,
      additions: 0,
      deletions: 0,
      lastCommit: c.date,
      firstCommit: c.date,
      fileCounts: new Map(),
      heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)),
    };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    if (new Date(c.date) > new Date(cur.lastCommit)) cur.lastCommit = c.date;
    if (new Date(c.date) < new Date(cur.firstCommit)) cur.firstCommit = c.date;
    const { day, hour } = kstParts(c.date);
    cur.heatmap[day][hour] += 1;
    for (const f of c.filesChanged) {
      cur.fileCounts.set(f, (cur.fileCounts.get(f) ?? 0) + 1);
    }
    m.set(key, cur);
  }
  return [...m.values()]
    .map((c) => {
      let topFile = '';
      let topFileCount = 0;
      let filesTouched = 0;
      for (const [f, n] of c.fileCounts) {
        if (n > topFileCount) { topFile = f; topFileCount = n; }
        filesTouched += n;
      }
      return {
        email: c.email,
        author: c.author,
        commits: c.commits,
        additions: c.additions,
        deletions: c.deletions,
        lastCommit: c.lastCommit,
        firstCommit: c.firstCommit,
        topFile,
        topFileCount,
        filesTouched,
        heatmap: c.heatmap,
      };
    })
    .sort((a, b) => b.commits - a.commits);
}

export function hotspots(commits, top = 20) {
  const m = new Map();
  for (const c of commits) for (const f of c.filesChanged) m.set(f, (m.get(f) ?? 0) + 1);
  return [...m.entries()].map(([file, touches]) => ({ file, touches }))
    .sort((a, b) => b.touches - a.touches).slice(0, top);
}

export function busFactor(commits, threshold = 0.5) {
  // 다른 통계와 일관되게 이메일(소문자) 기준으로 집계.
  const m = new Map();
  for (const c of commits) {
    const key = (c.email || c.author || '').toLowerCase();
    m.set(key, (m.get(key) ?? 0) + c.filesChanged.length);
  }
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const sorted = [...m.values()].sort((a, b) => b - a);
  let acc = 0;
  for (let i = 0; i < sorted.length; i++) {
    acc += sorted[i];
    if (acc / total >= threshold) return i + 1;
  }
  return sorted.length;
}

export function heatmap(commits) {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of commits) {
    const { day, hour } = kstParts(c.date);
    g[day][hour] += 1;
  }
  return g;
}

export function buildResult(repo, commits, topN = 20) {
  return {
    repo,
    generatedAt: new Date().toISOString(),
    totalCommits: commits.length,
    contributors: byContributor(commits),
    hotspots: hotspots(commits, topN),
    busFactor: busFactor(commits),
    heatmap: heatmap(commits),
  };
}
