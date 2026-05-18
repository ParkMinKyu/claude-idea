#!/usr/bin/env node
// Self-contained CLI: zero npm dependencies.
// Install once: `npm install -g .` (from this folder) → then `git-stats` works anywhere.
// Requires only system `git` CLI (already on every dev machine).

import { execFileSync } from 'node:child_process';
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

function loadCommits(repoPath, opts) {
  const args = ['log', '--numstat', '--date=iso-strict', '--pretty=format:COMMIT%x1f%H%x1f%an%x1f%ae%x1f%aI'];
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
    throw new Error(`git log 실패: ${err.stderr?.toString() ?? err.message}`);
  }
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

function splitPath(p) {
  const i = p.lastIndexOf('/');
  if (i === -1) return { dir: '', name: p };
  return { dir: p.slice(0, i + 1), name: p.slice(i + 1) };
}

function fmt(n) {
  return n.toLocaleString('ko-KR');
}

function renderHtml(repo, commits, topN) {
  const contributors = byContributor(commits);
  const hot = hotspots(commits, topN);
  const bus = busFactor(commits);
  const grid = heatmap(commits);
  const maxC = Math.max(1, ...contributors.map((c) => c.commits));
  const maxH = Math.max(1, ...hot.map((h) => h.touches));
  const maxHeat = Math.max(1, ...grid.flat());
  const totalAdd = contributors.reduce((s, c) => s + c.additions, 0);
  const totalDel = contributors.reduce((s, c) => s + c.deletions, 0);

  const contribRows = contributors.map((c, i) => {
    const pct = (c.commits / maxC) * 100;
    return `
    <div class="row">
      <span class="rank">${i + 1}</span>
      <div class="row-main">
        <div class="row-title">
          <span class="row-name">${esc(c.author)}</span>
          <span class="row-sub">+${fmt(c.additions)} / -${fmt(c.deletions)}</span>
        </div>
        <div class="row-bar"><div class="row-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="row-value">${fmt(c.commits)}<span class="row-unit">commits</span></div>
    </div>`;
  }).join('');

  const hotRows = hot.map((h, i) => {
    const pct = (h.touches / maxH) * 100;
    const { dir, name } = splitPath(h.file);
    return `
    <div class="row">
      <span class="rank">${i + 1}</span>
      <div class="row-main">
        <div class="row-title path">
          ${dir ? `<span class="path-dir">${esc(dir)}</span>` : ''}<span class="path-name">${esc(name)}</span>
        </div>
        <div class="row-bar"><div class="row-fill hot" style="width:${pct}%"></div></div>
      </div>
      <div class="row-value">${h.touches}<span class="row-unit">회</span></div>
    </div>`;
  }).join('');

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const heatCells = [];
  for (let d = 0; d < 7; d++) {
    heatCells.push(`<div class="heat-day-label">${days[d]}</div>`);
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.18 + (v / maxHeat) * 0.82;
      heatCells.push(`<div class="heat-cell" style="background:rgba(124,58,237,${intensity})" title="${days[d]}요일 ${h}시 · ${v}건">${v > 0 ? `<span class="heat-num">${v}</span>` : ''}</div>`);
    }
  }
  const hourLabels = Array.from({ length: 24 }, (_, h) =>
    `<div class="heat-hour-label">${h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}</div>`
  ).join('');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>Git Stats · ${esc(repo)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#0b0f17;--bg-2:#121826;--bg-3:#1a2332;--border:#243044;--text:#e6edf7;--dim:#95a3bd;--dim-2:#5d6b85;--accent:#7c3aed;--accent-2:#06b6d4;--hot:#f59e0b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,"Segoe UI","Pretendard","Apple SD Gothic Neo",sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
.container{max-width:1280px;margin:0 auto;padding:40px 32px}

header{padding:0 0 32px;border-bottom:1px solid var(--border);margin-bottom:40px}
header h1{margin:0 0 12px;font-size:34px;font-weight:700;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header .meta{color:var(--dim);font-size:13px;font-family:"SF Mono",Menlo,monospace}
header .meta strong{color:var(--text)}

.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:48px}
.stat{background:var(--bg-2);border:1px solid var(--border);padding:24px;border-radius:14px;position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--accent-2)}
.stat.warn::before{background:var(--hot)}
.stat .label{color:var(--dim);font-size:13px;font-weight:500;margin-bottom:8px}
.stat .value{font-size:36px;font-weight:700;color:var(--text);line-height:1;letter-spacing:-0.02em}
.stat .desc{color:var(--dim-2);font-size:11px;margin-top:8px}

section{margin-bottom:48px}
section h2{font-size:20px;margin:0 0 8px;font-weight:600;display:flex;align-items:center;gap:12px}
section .h2-hint{color:var(--dim);font-size:13px;font-weight:400;margin-bottom:20px}
.section-card{background:var(--bg-2);border:1px solid var(--border);border-radius:14px;overflow:hidden}

.row{display:grid;grid-template-columns:48px 1fr auto;gap:20px;padding:16px 24px;align-items:center;border-bottom:1px solid var(--border)}
.row:last-child{border-bottom:none}
.row:hover{background:var(--bg-3)}
.rank{color:var(--dim-2);font-size:14px;font-weight:600;text-align:center;font-family:"SF Mono",Menlo,monospace}
.row-main{min-width:0}
.row-title{font-size:14px;margin-bottom:10px;line-height:1.5;word-break:break-all}
.row-title.path{font-family:"SF Mono",Menlo,monospace;font-size:13px}
.row-name{color:var(--text);font-weight:600;font-size:15px}
.row-sub{color:var(--dim);font-size:12px;margin-left:12px;font-family:"SF Mono",Menlo,monospace}
.path-dir{color:var(--dim-2)}
.path-name{color:var(--text);font-weight:600}
.row-bar{background:var(--bg-3);height:6px;border-radius:999px;overflow:hidden}
.row-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),#a78bfa);transition:width 0.3s}
.row-fill.hot{background:linear-gradient(90deg,var(--hot),#fbbf24)}
.row-value{font-size:24px;font-weight:700;color:var(--accent-2);white-space:nowrap;text-align:right;line-height:1}
.row-value .row-unit{font-size:12px;color:var(--dim);margin-left:6px;font-weight:400}

.heat-wrap{padding:24px}
.heatmap{display:grid;grid-template-columns:40px repeat(24,1fr);gap:3px}
.heat-day-label{color:var(--dim);font-size:13px;font-weight:600;display:flex;align-items:center;padding-right:8px}
.heat-cell{aspect-ratio:1;min-width:22px;background:var(--bg-3);border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.1s}
.heat-cell:hover{transform:scale(1.3);z-index:1;outline:1px solid var(--accent)}
.heat-num{color:#fff;font-size:10px;font-weight:600;font-family:"SF Mono",Menlo,monospace}
.heat-hour-row{display:grid;grid-template-columns:40px repeat(24,1fr);gap:3px;margin-top:8px}
.heat-hour-label{color:var(--dim-2);font-size:10px;text-align:center;font-family:"SF Mono",Menlo,monospace}
.heat-legend{display:flex;align-items:center;gap:8px;margin-top:16px;color:var(--dim);font-size:12px;justify-content:flex-end}
.heat-legend-cell{width:14px;height:14px;border-radius:2px}

footer{text-align:center;color:var(--dim);font-size:12px;padding:32px 0;border-top:1px solid var(--border);margin-top:48px}

@media (max-width:768px){
  .container{padding:20px 16px}
  .row{grid-template-columns:32px 1fr auto;gap:12px;padding:14px 16px}
  .row-value{font-size:18px}
  header h1{font-size:24px}
  .stat .value{font-size:28px}
  .heat-cell{min-width:14px}
  .heat-day-label{font-size:11px}
}
</style></head><body><div class="container">

<header>
  <h1>📊 Git Stats Report</h1>
  <div class="meta"><strong>${esc(repo)}</strong> · 분석 시각 ${new Date().toLocaleString('ko-KR')}</div>
</header>

<div class="stats-grid">
  <div class="stat">
    <div class="label">총 커밋</div>
    <div class="value">${fmt(commits.length)}</div>
    <div class="desc">분석 대상 커밋 수</div>
  </div>
  <div class="stat">
    <div class="label">기여자</div>
    <div class="value">${fmt(contributors.length)}</div>
    <div class="desc">고유한 author 수</div>
  </div>
  <div class="stat${bus === 1 ? ' warn' : ''}">
    <div class="label">Bus Factor</div>
    <div class="value">${bus}</div>
    <div class="desc">${bus === 1 ? '⚠ 1명에게 집중됨' : `${bus}명이 50%+ 점유`}</div>
  </div>
  <div class="stat">
    <div class="label">변경량</div>
    <div class="value" style="color:#22c55e">+${fmt(totalAdd)}</div>
    <div class="desc"><span style="color:#ef4444">-${fmt(totalDel)}</span> 삭제</div>
  </div>
</div>

<section>
  <h2>👥 기여자 순위</h2>
  <div class="h2-hint">커밋 수 기준 내림차순. 추가/삭제 라인 수 함께 표시.</div>
  <div class="section-card">${contribRows}</div>
</section>

<section>
  <h2>🔥 핫스팟 — 가장 자주 수정된 파일</h2>
  <div class="h2-hint">변경 빈도가 높은 파일은 리팩토링 후보이자 버그 위험 지대입니다.</div>
  <div class="section-card">${hotRows}</div>
</section>

<section>
  <h2>🕐 시간대 히트맵</h2>
  <div class="h2-hint">UTC 기준 · 가로축 시간 (00~23시), 세로축 요일. 진한 색일수록 커밋 많음.</div>
  <div class="section-card heat-wrap">
    <div class="heatmap">${heatCells.join('')}</div>
    <div class="heat-hour-row"><div></div>${hourLabels}</div>
    <div class="heat-legend">
      <span>적음</span>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,0.18)"></div>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,0.5)"></div>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,1)"></div>
      <span>많음</span>
    </div>
  </div>
</section>

<footer>Generated by <strong>git-stats</strong> · 100 Monetization Ideas</footer>
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

  const commits = loadCommits(repo, {
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
