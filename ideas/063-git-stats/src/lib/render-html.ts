import type { Commit } from './stats';
import { byContributor, hotspots, busFactor, heatmap } from './stats';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderHtmlReport(repo: string, commits: Commit[], topN = 20): string {
  const contributors = byContributor(commits);
  const hot = hotspots(commits, topN);
  const bus = busFactor(commits);
  const grid = heatmap(commits);

  const maxC = Math.max(1, ...contributors.map((c) => c.commits));
  const maxH = Math.max(1, ...hot.map((h) => h.touches));
  const maxHeat = Math.max(1, ...grid.flat());

  const contribBars = contributors
    .map((c) => {
      const pct = (c.commits / maxC) * 100;
      return `<div class="bar-row">
        <div class="bar-label">${escapeHtml(c.author)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">${c.commits} <span class="muted">commits · +${c.additions}/-${c.deletions}</span></div>
      </div>`;
    })
    .join('');

  const hotRows = hot
    .map((h) => {
      const pct = (h.touches / maxH) * 100;
      return `<div class="bar-row">
        <div class="bar-label" title="${escapeHtml(h.file)}">${escapeHtml(h.file)}</div>
        <div class="bar-track"><div class="bar-fill hot" style="width:${pct}%"></div></div>
        <div class="bar-value">${h.touches}</div>
      </div>`;
    })
    .join('');

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const heatCells: string[] = [];
  for (let d = 0; d < 7; d++) {
    heatCells.push(`<div class="heat-day-label">${days[d]}</div>`);
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.15 + (v / maxHeat) * 0.85;
      heatCells.push(
        `<div class="heat-cell" style="background:rgba(124,58,237,${intensity})" title="${days[d]}요일 ${h}시 · ${v}건"></div>`,
      );
    }
  }

  const hourLabels = Array.from({ length: 24 }, (_, h) =>
    `<div class="heat-hour-label">${h % 6 === 0 ? h : ''}</div>`,
  ).join('');

  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<title>Git Stats Report · ${escapeHtml(repo)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root { --bg:#0b0f17; --bg-2:#121826; --bg-3:#1a2332; --border:#243044; --text:#e6edf7; --dim:#95a3bd; --accent:#7c3aed; --accent-2:#06b6d4; --hot:#f59e0b; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font-family:-apple-system,"Segoe UI","Pretendard",sans-serif; line-height:1.5; }
.container { max-width:1100px; margin:0 auto; padding:32px 24px; }
header { padding:32px 0 24px; border-bottom:1px solid var(--border); margin-bottom:32px; }
header h1 { margin:0 0 8px; font-size:28px; background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
header .meta { color:var(--dim); font-size:13px; font-family:"SF Mono",Menlo,monospace; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:32px; }
.stat { background:var(--bg-2); border:1px solid var(--border); padding:16px; border-radius:10px; }
.stat .label { color:var(--dim); font-size:12px; }
.stat .value { font-size:28px; font-weight:700; color:var(--accent-2); margin-top:4px; }
section { margin-bottom:40px; }
section h2 { font-size:18px; margin:0 0 16px; padding-bottom:10px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
section h2 .hint { font-size:12px; color:var(--dim); font-weight:400; }
.bar-row { display:grid; grid-template-columns:200px 1fr 180px; gap:12px; padding:6px 0; align-items:center; }
.bar-label { color:var(--text); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:"SF Mono",Menlo,monospace; }
.bar-track { background:var(--bg-3); height:10px; border-radius:999px; overflow:hidden; }
.bar-fill { background:var(--accent); height:100%; border-radius:999px; }
.bar-fill.hot { background:var(--hot); }
.bar-value { color:var(--dim); font-size:12px; text-align:right; font-family:"SF Mono",Menlo,monospace; }
.muted { color:var(--dim); font-size:11px; }
.heatmap { display:grid; grid-template-columns:30px repeat(24,1fr); gap:2px; }
.heat-day-label { color:var(--dim); font-size:11px; display:flex; align-items:center; }
.heat-cell { aspect-ratio:1; min-width:18px; background:var(--bg-3); border-radius:2px; }
.heat-hour-row { display:grid; grid-template-columns:30px repeat(24,1fr); gap:2px; margin-top:4px; }
.heat-hour-label { color:var(--dim); font-size:10px; text-align:center; }
footer { text-align:center; color:var(--dim); font-size:12px; padding:32px 0; border-top:1px solid var(--border); margin-top:32px; }
</style>
</head><body>
<div class="container">
  <header>
    <h1>📊 Git Stats Report</h1>
    <div class="meta">${escapeHtml(repo)} · 생성 ${new Date().toLocaleString('ko-KR')}</div>
  </header>

  <div class="stats-grid">
    <div class="stat"><div class="label">총 커밋</div><div class="value">${commits.length}</div></div>
    <div class="stat"><div class="label">기여자</div><div class="value">${contributors.length}</div></div>
    <div class="stat"><div class="label">Bus Factor</div><div class="value">${bus}</div></div>
    <div class="stat"><div class="label">변경 파일</div><div class="value">${hot.length}</div></div>
  </div>

  <section>
    <h2>👥 기여자 <span class="hint">커밋 수 기준 내림차순</span></h2>
    ${contribBars}
  </section>

  <section>
    <h2>🔥 핫스팟 <span class="hint">가장 자주 수정된 파일 — 리팩토링 후보</span></h2>
    ${hotRows}
  </section>

  <section>
    <h2>🕐 시간대 히트맵 <span class="hint">UTC 기준 · 요일 × 시간</span></h2>
    <div class="heatmap">${heatCells.join('')}</div>
    <div class="heat-hour-row">
      <div></div>${hourLabels}
    </div>
  </section>

  <footer>Generated by git-stats · 100 Monetization Ideas</footer>
</div>
</body></html>`;
}
