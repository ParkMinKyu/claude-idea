#!/usr/bin/env node
// Self-contained CLI: zero compile step needed.
// Install once: `npm install -g .` (from this folder) → then `git-stats` works anywhere.

import simpleGit from 'simple-git';
import fs from 'node:fs';
import path from 'node:path';

const HELP = `git-stats — 로컬 git 저장소 기여 통계 분석기

사용법:
  git-stats analyze <repo-path> [options]
  git-stats --help

옵션:
  --since=YYYY-MM-DD    이 날짜 이후 커밋만
  --until=YYYY-MM-DD    이 날짜 이전 커밋만
  --branch=<name>       특정 브랜치
  --top=<n>             핫스팟 상위 N개 (기본: 20)
  --pretty              JSON을 사람이 읽기 좋게 출력
  --html                JSON 대신 시각화된 HTML 리포트
  --out=<file>          파일로 저장 (예: report.html, stats.json)

예시:
  git-stats analyze .                                           # 현재 폴더 분석
  git-stats analyze ~/myrepo --html --out=report.html           # HTML 리포트
  git-stats analyze ~/myrepo --since=2025-01-01 --pretty
  git-stats analyze ~/myrepo > stats.json                       # JSON 저장
`;

// ─────────── arg parsing ───────────
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      flags[k] = v ?? true;
    } else positional.push(a);
  }
  return { cmd: positional[0] ?? '', repo: positional[1], flags };
}

// ─────────── git log parser ───────────
function parseGitLog(raw) {
  const commits = [];
  let current = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('COMMIT\x1f')) {
      if (current) commits.push(current);
      const [, hash, author, email, date] = line.split('\x1f');
      current = { hash, author, email, date, filesChanged: [], additions: 0, deletions: 0 };
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

async function loadCommits(repoPath, opts) {
  const git = simpleGit(repoPath);
  const args = ['log', '--numstat', '--date=iso-strict', '--pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI'];
  if (opts.branch) args.push(opts.branch);
  if (opts.since) args.push(`--since=${opts.since}`);
  if (opts.until) args.push(`--until=${opts.until}`);
  const raw = await git.raw(args);
  return parseGitLog(raw);
}

// ─────────── stats ───────────
function byContributor(commits) {
  const m = new Map();
  for (const c of commits) {
    const cur = m.get(c.author) ?? { author: c.author, commits: 0, additions: 0, deletions: 0 };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    m.set(c.author, cur);
  }
  return [...m.values()].sort((a, b) => b.commits - a.commits);
}

function hotspots(commits, top = 20) {
  const m = new Map();
  for (const c of commits) for (const f of c.filesChanged) m.set(f, (m.get(f) ?? 0) + 1);
  return [...m.entries()].map(([file, touches]) => ({ file, touches }))
    .sort((a, b) => b.touches - a.touches).slice(0, top);
}

function busFactor(commits, threshold = 0.5) {
  const m = new Map();
  for (const c of commits) m.set(c.author, (m.get(c.author) ?? 0) + c.filesChanged.length);
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

function heatmap(commits) {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of commits) {
    const d = new Date(c.date);
    g[d.getUTCDay()][d.getUTCHours()] += 1;
  }
  return g;
}

// ─────────── HTML renderer ───────────
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderHtml(repo, commits, topN) {
  const contributors = byContributor(commits);
  const hot = hotspots(commits, topN);
  const bus = busFactor(commits);
  const grid = heatmap(commits);
  const maxC = Math.max(1, ...contributors.map((c) => c.commits));
  const maxH = Math.max(1, ...hot.map((h) => h.touches));
  const maxHeat = Math.max(1, ...grid.flat());

  const contribBars = contributors.map((c) => {
    const pct = (c.commits / maxC) * 100;
    return `<div class="bar-row"><div class="bar-label">${esc(c.author)}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-value">${c.commits} <span class="muted">commits · +${c.additions}/-${c.deletions}</span></div></div>`;
  }).join('');

  const hotRows = hot.map((h) => {
    const pct = (h.touches / maxH) * 100;
    return `<div class="bar-row"><div class="bar-label" title="${esc(h.file)}">${esc(h.file)}</div><div class="bar-track"><div class="bar-fill hot" style="width:${pct}%"></div></div><div class="bar-value">${h.touches}</div></div>`;
  }).join('');

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const heatCells = [];
  for (let d = 0; d < 7; d++) {
    heatCells.push(`<div class="heat-day-label">${days[d]}</div>`);
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.15 + (v / maxHeat) * 0.85;
      heatCells.push(`<div class="heat-cell" style="background:rgba(124,58,237,${intensity})" title="${days[d]}요일 ${h}시 · ${v}건"></div>`);
    }
  }
  const hourLabels = Array.from({ length: 24 }, (_, h) => `<div class="heat-hour-label">${h % 6 === 0 ? h : ''}</div>`).join('');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>Git Stats · ${esc(repo)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#0b0f17;--bg-2:#121826;--bg-3:#1a2332;--border:#243044;--text:#e6edf7;--dim:#95a3bd;--accent:#7c3aed;--accent-2:#06b6d4;--hot:#f59e0b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,"Segoe UI","Pretendard",sans-serif;line-height:1.5}
.container{max-width:1100px;margin:0 auto;padding:32px 24px}
header{padding:32px 0 24px;border-bottom:1px solid var(--border);margin-bottom:32px}
header h1{margin:0 0 8px;font-size:28px;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header .meta{color:var(--dim);font-size:13px;font-family:"SF Mono",Menlo,monospace}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:32px}
.stat{background:var(--bg-2);border:1px solid var(--border);padding:16px;border-radius:10px}
.stat .label{color:var(--dim);font-size:12px}.stat .value{font-size:28px;font-weight:700;color:var(--accent-2);margin-top:4px}
section{margin-bottom:40px}
section h2{font-size:18px;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
section h2 .hint{font-size:12px;color:var(--dim);font-weight:400}
.bar-row{display:grid;grid-template-columns:200px 1fr 180px;gap:12px;padding:6px 0;align-items:center}
.bar-label{color:var(--text);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:"SF Mono",Menlo,monospace}
.bar-track{background:var(--bg-3);height:10px;border-radius:999px;overflow:hidden}
.bar-fill{background:var(--accent);height:100%;border-radius:999px}.bar-fill.hot{background:var(--hot)}
.bar-value{color:var(--dim);font-size:12px;text-align:right;font-family:"SF Mono",Menlo,monospace}
.muted{color:var(--dim);font-size:11px}
.heatmap{display:grid;grid-template-columns:30px repeat(24,1fr);gap:2px}
.heat-day-label{color:var(--dim);font-size:11px;display:flex;align-items:center}
.heat-cell{aspect-ratio:1;min-width:18px;background:var(--bg-3);border-radius:2px}
.heat-hour-row{display:grid;grid-template-columns:30px repeat(24,1fr);gap:2px;margin-top:4px}
.heat-hour-label{color:var(--dim);font-size:10px;text-align:center}
footer{text-align:center;color:var(--dim);font-size:12px;padding:32px 0;border-top:1px solid var(--border);margin-top:32px}
</style></head><body><div class="container">
<header><h1>📊 Git Stats Report</h1><div class="meta">${esc(repo)} · 생성 ${new Date().toLocaleString('ko-KR')}</div></header>
<div class="stats-grid">
<div class="stat"><div class="label">총 커밋</div><div class="value">${commits.length}</div></div>
<div class="stat"><div class="label">기여자</div><div class="value">${contributors.length}</div></div>
<div class="stat"><div class="label">Bus Factor</div><div class="value">${bus}</div></div>
<div class="stat"><div class="label">변경 파일</div><div class="value">${hot.length}</div></div>
</div>
<section><h2>👥 기여자 <span class="hint">커밋 수 기준 내림차순</span></h2>${contribBars}</section>
<section><h2>🔥 핫스팟 <span class="hint">가장 자주 수정된 파일 — 리팩토링 후보</span></h2>${hotRows}</section>
<section><h2>🕐 시간대 히트맵 <span class="hint">UTC 기준 · 요일 × 시간</span></h2>
<div class="heatmap">${heatCells.join('')}</div>
<div class="heat-hour-row"><div></div>${hourLabels}</div>
</section>
<footer>Generated by git-stats</footer>
</div></body></html>`;
}

// ─────────── main ───────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.help || args.cmd === '--help' || !args.cmd) {
    console.log(HELP);
    process.exit(args.cmd ? 0 : 1);
  }
  if (args.cmd !== 'analyze') {
    console.error(`알 수 없는 명령: ${args.cmd}\n`);
    console.log(HELP);
    process.exit(1);
  }

  const repo = path.resolve(args.repo ?? '.');
  if (!fs.existsSync(path.join(repo, '.git'))) {
    console.error(`Error: '${repo}' 에 .git 폴더가 없습니다. 올바른 git 저장소 경로를 지정하세요.`);
    process.exit(1);
  }

  const commits = await loadCommits(repo, {
    since: typeof args.flags.since === 'string' ? args.flags.since : undefined,
    until: typeof args.flags.until === 'string' ? args.flags.until : undefined,
    branch: typeof args.flags.branch === 'string' ? args.flags.branch : undefined,
  });

  const topN = typeof args.flags.top === 'string' ? parseInt(args.flags.top, 10) : 20;
  const outPath = typeof args.flags.out === 'string' ? args.flags.out : undefined;

  let output;
  if (args.flags.html) {
    output = renderHtml(repo, commits, topN);
  } else {
    const result = {
      repo, generatedAt: new Date().toISOString(), totalCommits: commits.length,
      contributors: byContributor(commits), hotspots: hotspots(commits, topN),
      busFactor: busFactor(commits), heatmap: heatmap(commits),
    };
    output = JSON.stringify(result, null, args.flags.pretty ? 2 : 0);
  }

  if (outPath) {
    fs.writeFileSync(outPath, output);
    console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋 분석)`);
    if (args.flags.html) console.error('  → 더블클릭으로 브라우저에서 열어보세요.');
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
