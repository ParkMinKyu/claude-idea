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

// ─────────── 추가 지표 (git 로그만으로 산출) ───────────

/** 월별 커밋 수 (활동 추이). [{ month:'2025-03', commits, additions, deletions }] 오름차순. */
export function activityByMonth(commits) {
  const m = new Map();
  for (const c of commits) {
    const month = c.date.slice(0, 7); // YYYY-MM (커밋 타임존 기준이지만 추세엔 충분)
    const cur = m.get(month) ?? { month, commits: 0, additions: 0, deletions: 0 };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    m.set(month, cur);
  }
  return [...m.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 기여자별 활동 구간 (첫~마지막 커밋). 합류/이탈 타임라인용.
 * [{ author, email, first, last, commits }] 첫 커밋 순.
 */
export function contributorSpans(commits) {
  const m = new Map();
  for (const c of commits) {
    const key = (c.email || c.author || '').toLowerCase();
    const cur = m.get(key) ?? { author: c.author, email: c.email, first: c.date, last: c.date, commits: 0 };
    cur.commits += 1;
    if (c.date < cur.first) cur.first = c.date;
    if (c.date > cur.last) cur.last = c.date;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => a.first.localeCompare(b.first));
}

/**
 * 파일별 기여자 분산 → 버스팩터 위험. 한 사람만 만진 파일이 위험.
 * top개 반환: [{ file, authors, topAuthor, topShare, touches, alive }].
 * trackedSet이 주어지면 현존 파일(alive) 표시.
 */
export function fileOwnership(commits, top = 20, trackedSet = null) {
  const files = new Map(); // file -> Map(email -> count)
  for (const c of commits) {
    for (const f of c.filesChanged) {
      let authors = files.get(f);
      if (!authors) { authors = new Map(); files.set(f, authors); }
      const key = (c.email || c.author || '').toLowerCase();
      authors.set(key, (authors.get(key) ?? 0) + 1);
    }
  }
  const rows = [];
  for (const [file, authors] of files) {
    let touches = 0; let topShare = 0; let topAuthor = '';
    for (const [a, n] of authors) { touches += n; if (n > topShare) { topShare = n; topAuthor = a; } }
    rows.push({
      file,
      authors: authors.size,
      topAuthor,
      topShare: topShare / touches, // 0~1
      touches,
      alive: trackedSet ? trackedSet.has(file) : null,
    });
  }
  // 위험 우선: 기여자 1명 + 변경 많음. 단독 소유(authors===1)를 먼저, 그 안에서 touches 많은 순.
  rows.sort((a, b) => (a.authors - b.authors) || (b.touches - a.touches));
  return rows.slice(0, top);
}

/**
 * 고아 파일: 현존(tracked)하지만 마지막 변경이 오래된 파일.
 * lastTouched(file -> ISO) 기준 오래된 순 top개.
 */
export function staleFiles(commits, trackedSet, top = 20) {
  if (!trackedSet || trackedSet.size === 0) return [];
  const last = new Map();
  for (const c of commits) {
    for (const f of c.filesChanged) {
      const prev = last.get(f);
      if (!prev || c.date > prev) last.set(f, c.date);
    }
  }
  const rows = [];
  for (const f of trackedSet) {
    const lt = last.get(f);
    if (lt) rows.push({ file: f, lastTouched: lt });
  }
  rows.sort((a, b) => a.lastTouched.localeCompare(b.lastTouched));
  return rows.slice(0, top);
}

/**
 * 변경 결합도: 한 커밋에서 함께 바뀐 파일 쌍 빈도. 숨은 의존성.
 * 거대 커밋(파일 많은)은 잡음이라 maxFilesPerCommit 이하만 집계.
 * [{ a, b, count }] top개.
 */
export function coupling(commits, top = 20, maxFilesPerCommit = 30) {
  const pairs = new Map();
  for (const c of commits) {
    const fs = c.filesChanged;
    if (fs.length < 2 || fs.length > maxFilesPerCommit) continue;
    const sorted = [...new Set(fs)].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = sorted[i] + '\x00' + sorted[j];
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  }
  return [...pairs.entries()]
    .map(([k, count]) => { const [a, b] = k.split('\x00'); return { a, b, count }; })
    .sort((x, y) => y.count - x.count)
    .slice(0, top);
}

/** 커밋 크기 분포 (변경 라인 기준 버킷). */
export function sizeDistribution(commits) {
  const buckets = [
    { label: '~10', max: 10, count: 0 },
    { label: '11–50', max: 50, count: 0 },
    { label: '51–200', max: 200, count: 0 },
    { label: '201–1000', max: 1000, count: 0 },
    { label: '1000+', max: Infinity, count: 0 },
  ];
  for (const c of commits) {
    const size = (c.additions ?? 0) + (c.deletions ?? 0);
    for (const b of buckets) { if (size <= b.max) { b.count += 1; break; } }
  }
  return buckets;
}

/** 커밋 메시지 컨벤션(conventional commits prefix) 준수율. */
export function messageConvention(commits) {
  const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
  const re = new RegExp(`^(${TYPES.join('|')})(\\([^)]*\\))?!?:`, 'i');
  const byType = new Map();
  let conforming = 0;
  for (const c of commits) {
    const subj = (c.subject || '').trim();
    const m = subj.match(re);
    if (m) {
      conforming += 1;
      const t = m[1].toLowerCase();
      byType.set(t, (byType.get(t) ?? 0) + 1);
    }
  }
  const total = commits.length || 1;
  const types = [...byType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  return { total: commits.length, conforming, rate: conforming / total, types };
}

/** 파일 확장자(언어) 분포 — 변경 횟수 기준 top개. */
export function languageDistribution(commits, top = 12) {
  const m = new Map();
  for (const c of commits) {
    for (const f of c.filesChanged) {
      const base = f.slice(f.lastIndexOf('/') + 1);
      const dot = base.lastIndexOf('.');
      const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : '(없음)';
      m.set(ext, (m.get(ext) ?? 0) + 1);
    }
  }
  const all = [...m.entries()].map(([ext, count]) => ({ ext, count })).sort((a, b) => b.count - a.count);
  const total = all.reduce((s, x) => s + x.count, 0) || 1;
  return { total, top: all.slice(0, top).map((x) => ({ ...x, share: x.count / total })) };
}

/** 현존 추적 파일 목록 (git ls-files). 고아/버스팩터 alive 표시에 사용. 실패 시 빈 Set. */
export function listTrackedFiles(repoPath, branch) {
  try {
    const args = ['ls-files'];
    if (branch) args.push('--', '.'); // branch 지정은 ls-tree가 정확하나, 단순화로 현재 워킹트리 기준
    const raw = execFileSync('git', ['ls-files'], {
      cwd: repoPath, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new Set(raw.split('\n').map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
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
