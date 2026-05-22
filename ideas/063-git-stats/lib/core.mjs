// git-stats 공유 코어: git 로그 파싱 · 통계 집계 · HTML 렌더.
// CLI(bin/git-stats.mjs)와 로컬 서버(bin/serve.mjs)가 함께 사용한다.
// 의존성 0 — 시스템 `git` CLI만 필요.

import { execFileSync } from 'node:child_process';

// ─────────── git log 로딩 & 파싱 ───────────
// `git log -M --numstat`의 리네임 표기를 최종(new) 경로로 정규화한다.
// 두 형식 모두 처리:
//   "src/{old => new}/a.ts"  → "src/new/a.ts"   (공통 prefix/suffix brace)
//   "old/path.ts => new/path.ts" → "new/path.ts" (전체 경로 화살표)
export function normalizeRenamePath(file) {
  if (file.indexOf('=>') === -1) return file;
  const brace = file.match(/^(.*)\{(.*) => (.*)\}(.*)$/);
  if (brace) {
    const [, pre, , newMid, post] = brace;
    return (pre + newMid + post).replace(/\/{2,}/g, '/');
  }
  const arrow = file.match(/^(.*) => (.*)$/);
  if (arrow) return arrow[2];
  return file;
}

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
    const file = normalizeRenamePath(fp.join('\t'));
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

// git stderr를 분류: "커밋 없음"류는 빈 결과(에러 아님). 테스트 가능하도록 분리.
export function isEmptyRepoError(stderr) {
  return /does not have any commits yet|bad default revision|unknown revision or path not in the working tree/i.test(stderr || '');
}

// 브랜치 인자 검증: '-'로 시작하면 git이 옵션으로 오인(인자 주입) → 거부.
// 허용: 영숫자·/·_·.·-(중간)·@·~·^ 등 일반 리비전 문자.
function safeRevision(rev) {
  if (typeof rev !== 'string' || !rev) return undefined;
  if (rev.startsWith('-')) throw new Error(`잘못된 브랜치/리비전: '${rev}'`);
  if (!/^[\w.\/@~^=+-]+$/.test(rev)) throw new Error(`잘못된 브랜치/리비전 문자: '${rev}'`);
  return rev;
}

// 날짜 인자 검증: YYYY-MM-DD 또는 git 상대표현(예: "2 weeks ago"). '-' 시작/특수문자 거부.
function safeDate(d) {
  if (typeof d !== 'string' || !d) return undefined;
  if (!/^[\w :.\/-]+$/.test(d) || d.startsWith('-')) throw new Error(`잘못된 날짜: '${d}'`);
  return d;
}

export function loadCommits(repoPath, opts = {}) {
  // -M: 리네임 추적(파서가 normalizeRenamePath로 최종 경로 정규화) → 핫스팟/결합 통계 분절 방지.
  const args = ['log', '--numstat', '-M', '--date=iso-strict', '--pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI%x1f%s'];
  if (!opts.includeMerges) args.push('--no-merges');
  if (opts.all) args.push('--all');
  const since = safeDate(opts.since);
  const until = safeDate(opts.until);
  if (since) args.push(`--since=${since}`);
  if (until) args.push(`--until=${until}`);
  // 브랜치는 safeRevision으로 '-' 시작/특수문자를 거부 → 옵션 오인(인자 주입) 차단.
  const branch = safeRevision(opts.branch);
  if (branch) args.push(branch);
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
    if (isEmptyRepoError(stderr)) return [];
    throw new Error(`git log 실패: ${stderr}`);
  }
}

// ─────────── 통계 ───────────
// KST = UTC+9. 모든 시간 기반 집계(히트맵·월별·날짜필터)를 KST로 통일해
// 같은 커밋이 기능마다 다른 날/달에 잡히는 불일치를 방지한다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export function kstParts(iso) {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}
/** ISO → KST 기준 'YYYY-MM-DD'. (날짜 필터·일 단위 집계용) */
export function kstDate(iso) {
  const k = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, '0')}-${String(k.getUTCDate()).padStart(2, '0')}`;
}
/** ISO → KST 기준 'YYYY-MM'. (월별 집계용) */
export function kstMonth(iso) {
  return kstDate(iso).slice(0, 7);
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

/**
 * 월별 커밋 수 (활동 추이). KST 기준. 활동 없는 달도 commits:0으로 채워
 * "식었던 구간"이 그래프에서 사라지지 않게 한다. [{ month, commits, additions, deletions }] 오름차순.
 */
export function activityByMonth(commits) {
  const m = new Map();
  for (const c of commits) {
    const month = kstMonth(c.date);
    const cur = m.get(month) ?? { month, commits: 0, additions: 0, deletions: 0 };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    m.set(month, cur);
  }
  if (m.size === 0) return [];
  const months = [...m.keys()].sort();
  // 첫~마지막 월 사이의 빈 달 채움.
  const out = [];
  let [y, mo] = months[0].split('-').map(Number);
  const [ey, emo] = months[months.length - 1].split('-').map(Number);
  while (y < ey || (y === ey && mo <= emo)) {
    const key = `${y}-${String(mo).padStart(2, '0')}`;
    out.push(m.get(key) ?? { month: key, commits: 0, additions: 0, deletions: 0 });
    mo += 1;
    if (mo > 12) { mo = 1; y += 1; }
  }
  return out;
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
 * top개 반환: [{ file, authors, topAuthor, topAuthorName, topShare, touches, alive }].
 * topAuthorName은 최다 기여자의 표시 이름("누가 떠나면 위험"의 그 누구).
 * trackedSet이 주어지면 현존 파일(alive) 표시.
 */
export function fileOwnership(commits, top = 20, trackedSet = null) {
  const files = new Map();      // file -> Map(email -> count)
  const nameOf = new Map();     // email -> 표시 이름
  for (const c of commits) {
    const key = (c.email || c.author || '').toLowerCase();
    if (c.author && !nameOf.has(key)) nameOf.set(key, c.author);
    for (const f of c.filesChanged) {
      let authors = files.get(f);
      if (!authors) { authors = new Map(); files.set(f, authors); }
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
      topAuthorName: nameOf.get(topAuthor) || topAuthor,
      topShare: topShare / touches, // 0~1
      touches,
      alive: trackedSet ? trackedSet.has(file) : null,
    });
  }
  // 위험 우선: 기여자 1명 + 변경 많음. 단독 소유(authors===1)를 먼저, 그 안에서 touches 많은 순.
  rows.sort((a, b) => (a.authors - b.authors) || (b.touches - a.touches) || a.file.localeCompare(b.file));
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
 * 변경 결합도(고도화): 한 커밋에서 함께 바뀐 파일 쌍.
 *
 * 절대 횟수가 아니라 "A가 바뀌면 B도 바뀔 확률" = 결합 강도(strength)를 핵심 지표로:
 *   strength = together / min(aTotal, bTotal)   (둘 중 덜 바뀐 쪽 기준; Tornhill 정의)
 *
 * 옵션:
 *   top              상위 N쌍
 *   maxFilesPerCommit 거대 커밋(일괄 포맷·리네임) 제외 임계 (가짜 결합 방지)
 *   minTogether      최소 동시변경 횟수 (우연 제거)
 *   minStrength      최소 강도(0~1) (약한 결합 숨김)
 *   timeWeighted     최근 커밋에 지수 감쇠 가중 (halfLifeDays 반감기)
 *   halfLifeDays     가중 반감기(일)
 *
 * 반환: [{ a, b, together, aTotal, bTotal, strength, aHot, bHot, score }]
 *   aHot/bHot = 각 파일 총 변경 횟수(핫스팟). score = strength × log2(together+1) × (둘 중 핫한 정도)
 *   → '자주 바뀌고 + 강하게 결합'된 쌍이 위로 (리팩토링 우선순위).
 */
export function coupling(commits, {
  top = 20, maxFilesPerCommit = 30, minTogether = 2, minStrength = 0,
  timeWeighted = false, halfLifeDays = 365,
} = {}) {
  const fileTotal = new Map();   // file -> 총 변경 횟수(핫스팟)
  const pairTogether = new Map(); // "a\x00b" -> 동시변경 횟수
  const pairWeight = new Map();    // 시간가중 합

  const now = Date.now();
  const halfMs = halfLifeDays * 86400 * 1000;
  const weightOf = (iso) => {
    if (!timeWeighted) return 1;
    const age = now - new Date(iso).getTime();
    return Math.pow(0.5, age / halfMs); // 반감기마다 절반
  };

  // 분자(together)와 분모(fileTotal)의 모집단을 일치시킨다: 거대 커밋을 제외한
  // 커밋만으로 둘 다 집계해야 강도(together/min)가 일관됨.
  for (const c of commits) {
    const fs = [...new Set(c.filesChanged)];
    if (fs.length < 2 || fs.length > maxFilesPerCommit) continue;
    for (const f of fs) fileTotal.set(f, (fileTotal.get(f) ?? 0) + 1);
    const w = weightOf(c.date);
    const sorted = fs.sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = sorted[i] + '\x00' + sorted[j];
        pairTogether.set(key, (pairTogether.get(key) ?? 0) + 1);
        pairWeight.set(key, (pairWeight.get(key) ?? 0) + w);
      }
    }
  }

  const maxFileTotal = Math.max(1, ...fileTotal.values());
  const rows = [];
  for (const [key, together] of pairTogether) {
    if (together < minTogether) continue;
    const [a, b] = key.split('\x00');
    const aTotal = fileTotal.get(a) ?? together;
    const bTotal = fileTotal.get(b) ?? together;
    const strength = together / Math.min(aTotal, bTotal);
    if (strength < minStrength) continue;
    const aHot = aTotal, bHot = bTotal;
    // 우선순위 점수: 강도 × 동시변경 규모(로그) × 핫한 정도(0~1).
    // base는 1 이상으로 클램프(시간가중 합이 1 미만이면 log2가 음수가 되어 정렬이 뒤집힘).
    const hotFactor = Math.max(aHot, bHot) / maxFileTotal;
    const base = Math.max(1, timeWeighted ? pairWeight.get(key) : together);
    const score = strength * Math.log2(base + 1) * (0.5 + 0.5 * hotFactor);
    rows.push({ a, b, together, aTotal, bTotal, strength, aHot, bHot, score });
  }
  // score 동률 시 경로 사전순으로 결정적 정렬.
  return rows.sort((x, y) => (y.score - x.score) || (x.a + x.b).localeCompare(y.a + y.b)).slice(0, top);
}

/**
 * 한 파일 기준 결합: target과 함께 바뀐 파일들을 강도순으로.
 * coupling과 동일하게 거대 커밋 제외 모집단으로 분자·분모 일치.
 * 양방향 강도도 제공: outbound = together/targetTotal ("이 파일 바뀌면 상대도"),
 *                      inbound  = together/partnerTotal ("상대 바뀌면 이 파일도").
 * { file, totalChanges, partners: [{ file, together, strength, outbound, inbound, hot }] }
 */
export function couplingForFile(commits, targetFile, { top = 40, maxFilesPerCommit = 30 } = {}) {
  const fileTotal = new Map();
  const partnerTogether = new Map();
  let targetTotal = 0;
  for (const c of commits) {
    const fs = [...new Set(c.filesChanged)];
    if (fs.length < 2 || fs.length > maxFilesPerCommit) continue; // 거대 커밋 제외(분자·분모 동일 모집단)
    for (const f of fs) fileTotal.set(f, (fileTotal.get(f) ?? 0) + 1);
    if (!fs.includes(targetFile)) continue;
    targetTotal += 1;
    for (const f of fs) {
      if (f === targetFile) continue;
      partnerTogether.set(f, (partnerTogether.get(f) ?? 0) + 1);
    }
  }
  const partners = [];
  for (const [file, together] of partnerTogether) {
    const pTotal = fileTotal.get(file) ?? together;
    const denom = targetTotal || together;
    partners.push({
      file, together, hot: pTotal,
      strength: together / Math.min(denom, pTotal),
      outbound: together / denom,
      inbound: together / pTotal,
    });
  }
  partners.sort((a, b) => (b.strength - a.strength) || (b.together - a.together) || a.file.localeCompare(b.file));
  return { file: targetFile, totalChanges: targetTotal, partners: partners.slice(0, top) };
}

/**
 * 결합 후보 파일(2개 이상 파일이 바뀐 커밋에 등장)을 폴더 트리로.
 * 단독으로만 바뀐 파일은 결합이 없어 제외. 변경횟수(hot) 상위 maxFiles로 제한.
 * 반환: { root: 트리노드, fileCount, total, truncated }
 *   노드: { name, path, children?, file?, hot? }  (children 있으면 폴더)
 */
export function fileTree(commits, { maxFiles = 2000, maxFilesPerCommit = 30 } = {}) {
  const hot = new Map();        // file -> 총 변경 횟수
  const coupled = new Set();     // 결합 1건 이상인 파일
  for (const c of commits) {
    const fs = [...new Set(c.filesChanged)];
    for (const f of fs) hot.set(f, (hot.get(f) ?? 0) + 1);
    if (fs.length >= 2 && fs.length <= maxFilesPerCommit) for (const f of fs) coupled.add(f);
  }
  let files = [...coupled].map((f) => ({ file: f, hot: hot.get(f) ?? 0 }));
  const total = files.length;
  files.sort((a, b) => b.hot - a.hot);
  const truncated = files.length > maxFiles;
  if (truncated) files = files.slice(0, maxFiles);

  const root = { name: '', path: '', children: [] };
  const dirIndex = new Map([['', root]]);
  const ensureDir = (dirPath) => {
    if (dirIndex.has(dirPath)) return dirIndex.get(dirPath);
    const slash = dirPath.lastIndexOf('/');
    const parentPath = slash === -1 ? '' : dirPath.slice(0, slash);
    const name = slash === -1 ? dirPath : dirPath.slice(slash + 1);
    const parent = ensureDir(parentPath);
    const node = { name, path: dirPath, children: [] };
    parent.children.push(node);
    dirIndex.set(dirPath, node);
    return node;
  };
  for (const { file, hot: h } of files) {
    const slash = file.lastIndexOf('/');
    const dirPath = slash === -1 ? '' : file.slice(0, slash);
    const name = slash === -1 ? file : file.slice(slash + 1);
    ensureDir(dirPath).children.push({ name, path: file, file, hot: h });
  }
  // 각 폴더: 폴더 먼저, 그 안에서 이름순.
  const sortNode = (node) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      const af = !!a.children, bf = !!b.children;
      if (af !== bf) return af ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  };
  sortNode(root);
  return { root, fileCount: files.length, total, truncated, maxFiles };
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

/**
 * 현존 추적 파일 목록 (git ls-files, 현재 워킹트리 기준). 고아/버스팩터 alive 표시에 사용.
 * 주의: 항상 HEAD 워킹트리 기준이라 과거 기간/다른 브랜치 필터와는 일치하지 않을 수 있음.
 * 실패 시 빈 Set.
 */
export function listTrackedFiles(repoPath) {
  try {
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
