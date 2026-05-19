#!/usr/bin/env node
// Self-contained CLI: zero npm dependencies.
// Install once: `npm install -g .` (from this folder) → then `git-stats` works anywhere.
// Requires only system `git` CLI (already on every dev machine).

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HELP = `git-stats — 로컬 git 저장소 기여 통계 분석기

사용법:
  git-stats [repo-path] [options]

기본 동작 (인수 없을 때):
  현재 폴더(.)를 분석 → git-stats-report.html 생성 → 브라우저로 자동 열기

옵션:
  --since=YYYY-MM-DD    이 날짜 이후 커밋만
  --until=YYYY-MM-DD    이 날짜 이전 커밋만
  --branch=<name>       특정 브랜치
  --top=<n>             핫스팟 상위 N개 (기본: 20)
  --json                HTML 대신 JSON 출력 (stdout)
  --pretty              JSON 들여쓰기 (--json과 함께)
  --out=<file>          출력 파일명 (기본: git-stats-report.html)
  --no-open             생성 후 브라우저 자동 열기 비활성화

예시:
  git-stats                                # 현재 폴더, HTML, 자동 열기
  git-stats ~/myrepo                       # 다른 폴더 분석
  git-stats ~/myrepo --since=2025-01-01
  git-stats . --json --pretty              # JSON으로 콘솔에 출력
  git-stats . --json > stats.json          # JSON 파일로 저장
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
  // Backward-compat: `git-stats analyze <path>` still works.
  // New behavior: first positional is treated as repo path.
  let repo;
  if (positional[0] === 'analyze') {
    repo = positional[1];
  } else {
    repo = positional[0];
  }
  return { repo, flags };
}

function openInBrowser(file) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open'
    : platform === 'win32' ? 'cmd'
    : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', file] : [file];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.unref();
    return true;
  } catch {
    return false;
  }
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
  // Key by email (lowercased) — same person under different aliases gets merged.
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
    const d = new Date(c.date);
    cur.heatmap[d.getUTCDay()][d.getUTCHours()] += 1;
    for (const f of c.filesChanged) {
      cur.fileCounts.set(f, (cur.fileCounts.get(f) ?? 0) + 1);
    }
    m.set(key, cur);
  }
  return [...m.values()]
    .map((c) => {
      let topFile = '';
      let topFileCount = 0;
      for (const [f, n] of c.fileCounts) {
        if (n > topFileCount) { topFile = f; topFileCount = n; }
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
        heatmap: c.heatmap,
      };
    })
    .sort((a, b) => b.commits - a.commits);
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

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}개월 전`;
  return `${Math.floor(diff / 86400 / 365)}년 전`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(seed) {
  // Deterministic color from email/name.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 55%, 45%)`;
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

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const contribCards = contributors.map((c, i) => {
    const seed = c.email || c.author || `${i}`;
    const top = c.topFile ? splitPath(c.topFile) : null;
    const pct = (c.commits / maxC) * 100;

    // Mini heatmap: per-contributor 7×24 grid, normalized to their own max.
    const myMax = Math.max(1, ...c.heatmap.flat());
    const miniCells = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = c.heatmap[d][h];
        const intensity = v === 0 ? 0 : 0.2 + (v / myMax) * 0.8;
        miniCells.push(
          `<div class="mini-cell" style="background:${v === 0 ? 'var(--bg-2)' : `rgba(124,58,237,${intensity})`}" title="${dayLabels[d]}요일 ${h}시 · ${v}건"></div>`
        );
      }
    }

    return `
    <div class="contrib-card">
      <div class="contrib-rank">#${i + 1}</div>
      <div class="contrib-head">
        <div class="avatar" style="background:${avatarColor(seed)}">${esc(initials(c.author))}</div>
        <div class="contrib-id">
          <div class="contrib-name">${esc(c.author || '(이름 없음)')}</div>
          <div class="contrib-email" title="${esc(c.email)}">${esc(c.email || '(이메일 없음)')}</div>
        </div>
      </div>
      <div class="contrib-big">
        <div class="big-num">${fmt(c.commits)}</div>
        <div class="big-lbl">commits</div>
      </div>
      <div class="contrib-bar"><div class="contrib-fill" style="width:${pct}%"></div></div>
      <div class="contrib-stats-row">
        <span class="add">+${fmt(c.additions)}</span>
        <span class="del">−${fmt(c.deletions)}</span>
      </div>
      <div class="contrib-meta">
        <div class="meta-item">
          <span class="meta-lbl">최근 커밋</span>
          <span class="meta-val" title="${fmtDate(c.lastCommit)}">${timeAgo(c.lastCommit)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">첫 커밋</span>
          <span class="meta-val" title="${fmtDate(c.firstCommit)}">${fmtDate(c.firstCommit)}</span>
        </div>
        <div class="meta-item col">
          <span class="meta-lbl">주력 파일</span>
          ${top ? `<span class="meta-val path" title="${esc(c.topFile)}"><span class="path-dir">${esc(top.dir)}</span><span class="path-name">${esc(top.name)}</span> <span class="path-cnt">×${c.topFileCount}</span></span>` : '<span class="meta-val">—</span>'}
        </div>
      </div>
      <div class="mini-heat-wrap">
        <div class="mini-heat-lbl">활동 패턴 <span class="mini-heat-sub">요일 × 시간 (UTC)</span></div>
        <div class="mini-heat">${miniCells.join('')}</div>
      </div>
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

/* Contributor cards */
.contrib-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:20px}
.contrib-card{background:var(--bg-3);border:1px solid var(--border);border-radius:12px;padding:20px;position:relative;transition:transform 0.15s,border-color 0.15s;min-width:0;overflow:hidden}
.contrib-card:hover{transform:translateY(-2px);border-color:var(--accent)}
.contrib-rank{position:absolute;top:14px;right:18px;color:var(--dim-2);font-size:13px;font-weight:700;font-family:"SF Mono",Menlo,monospace}
.contrib-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0}
.contrib-id{min-width:0;flex:1}
.contrib-name{font-size:15px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.contrib-email{color:var(--dim);font-size:11px;font-family:"SF Mono",Menlo,monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.contrib-big{display:flex;align-items:baseline;gap:8px;margin-bottom:10px}
.big-num{font-size:32px;font-weight:700;color:var(--accent-2);line-height:1;letter-spacing:-0.02em}
.big-lbl{color:var(--dim);font-size:13px}
.contrib-bar{background:var(--bg-2);height:5px;border-radius:999px;overflow:hidden;margin-bottom:8px}
.contrib-fill{height:100%;background:linear-gradient(90deg,var(--accent),#a78bfa);border-radius:999px}
.contrib-stats-row{display:flex;gap:12px;font-size:12px;font-family:"SF Mono",Menlo,monospace;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--border)}
.contrib-stats-row .add{color:#22c55e}
.contrib-stats-row .del{color:#ef4444}
.contrib-meta{display:flex;flex-direction:column;gap:8px}
.meta-item{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;min-width:0}
.meta-item.col{flex-direction:column;align-items:flex-start;gap:4px}
.meta-lbl{color:var(--dim);font-size:11px;flex-shrink:0}
.meta-val{color:var(--text);font-size:12px;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis}
.meta-val.path{text-align:left;width:100%;font-family:"SF Mono",Menlo,monospace;font-size:11px;line-height:1.4;word-break:break-all;white-space:normal}
.meta-val .path-cnt{color:var(--accent-2);font-weight:600;margin-left:4px}
.mini-heat-wrap{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}
.mini-heat-lbl{color:var(--dim);font-size:11px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:baseline}
.mini-heat-sub{color:var(--dim-2);font-size:10px;font-family:"SF Mono",Menlo,monospace}
.mini-heat{display:grid;grid-template-columns:repeat(24,1fr);grid-template-rows:repeat(7,1fr);gap:1px;aspect-ratio:24/7}
.mini-cell{border-radius:1px;background:var(--bg-2);min-height:6px}

@media (max-width:768px){
  .container{padding:20px 16px}
  .row{grid-template-columns:32px 1fr auto;gap:12px;padding:14px 16px}
  .row-value{font-size:18px}
  header h1{font-size:24px}
  .stat .value{font-size:28px}
  .heat-cell{min-width:14px}
  .heat-day-label{font-size:11px}
  .contrib-grid{grid-template-columns:1fr;padding:12px}
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
  <h2>👥 기여자 순위 <span class="hint">${contributors.length}명</span></h2>
  <div class="h2-hint">이메일 기준으로 집계. 같은 사람이 다른 이름으로 커밋해도 합쳐집니다.</div>
  <div class="section-card"><div class="contrib-grid">${contribCards}</div></div>
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
  if (args.flags.help) {
    console.log(HELP);
    process.exit(0);
  }

  const repo = path.resolve(args.repo ?? '.');
  if (!fs.existsSync(path.join(repo, '.git'))) {
    console.error(`Error: '${repo}' 에 .git 폴더가 없습니다.`);
    console.error(`사용: git-stats [저장소-경로]   (인수 없으면 현재 폴더 분석)`);
    process.exit(1);
  }

  const commits = loadCommits(repo, {
    since: typeof args.flags.since === 'string' ? args.flags.since : undefined,
    until: typeof args.flags.until === 'string' ? args.flags.until : undefined,
    branch: typeof args.flags.branch === 'string' ? args.flags.branch : undefined,
  });

  if (commits.length === 0) {
    console.error('분석할 커밋이 없습니다.');
    process.exit(1);
  }

  const topN = typeof args.flags.top === 'string' ? parseInt(args.flags.top, 10) : 20;
  const isJson = !!args.flags.json;

  // JSON mode: print to stdout (or --out file)
  if (isJson) {
    const result = {
      repo, generatedAt: new Date().toISOString(), totalCommits: commits.length,
      contributors: byContributor(commits), hotspots: hotspots(commits, topN),
      busFactor: busFactor(commits), heatmap: heatmap(commits),
    };
    const output = JSON.stringify(result, null, args.flags.pretty ? 2 : 0);
    const outPath = typeof args.flags.out === 'string' ? args.flags.out : undefined;
    if (outPath) {
      fs.writeFileSync(outPath, output);
      console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋)`);
    } else {
      process.stdout.write(output + '\n');
    }
    return;
  }

  // Default: HTML report, auto-save, auto-open browser
  const outPath = path.resolve(
    typeof args.flags.out === 'string' ? args.flags.out : 'git-stats-report.html'
  );
  fs.writeFileSync(outPath, renderHtml(repo, commits, topN));

  console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋 · ${byContributor(commits).length}명 기여자)`);

  if (!args.flags['no-open']) {
    const opened = openInBrowser(outPath);
    if (opened) {
      console.error('  → 브라우저에서 열고 있습니다…');
    } else {
      console.error('  → 더블클릭으로 브라우저에서 열어보세요.');
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
