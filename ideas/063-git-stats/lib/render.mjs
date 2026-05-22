// git-stats HTML 리포트 렌더러.
// 데이터를 페이지에 임베드하고 클라이언트에서 재집계 → 오프라인 파일 하나로 완결.
import { byContributor, hotspots, busFactor, heatmap } from './core.mjs';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function splitPath(p) {
  const i = p.lastIndexOf('/');
  if (i === -1) return { dir: '', name: p };
  return { dir: p.slice(0, i + 1), name: p.slice(i + 1) };
}
function fmt(n) { return n.toLocaleString('ko-KR'); }
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function avatarColor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 55%, 45%)`;
}
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
function kstParts(iso) {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 페이지 전체(<html>…)를 반환. 단독 HTML 파일로 저장하거나 서버가 그대로 전송. */
export function renderHtml(repo, commits, topN = 20) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>Git Stats · ${esc(repo)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
${STYLE}</head><body><div class="container">
${renderReportBody(repo, commits)}
</div>
<script id="commit-data" type="application/json">${JSON.stringify(commits).replace(/</g, '\\u003c')}</script>
${CLIENT_SCRIPT}
</body></html>`;
}

/** <div class="container"> 안에 들어갈 본문만 반환 (서버의 SPA가 innerHTML로 주입). */
export function renderReportBody(repo, commits) {
  const contributors = byContributor(commits);
  const hot = hotspots(commits, 20);
  const bus = busFactor(commits);
  const grid = heatmap(commits);
  const maxC = Math.max(1, ...contributors.map((c) => c.commits));
  const maxH = Math.max(1, ...hot.map((h) => h.touches));
  const maxHeat = Math.max(1, ...grid.flat());
  const totalAdd = contributors.reduce((s, c) => s + c.additions, 0);
  const totalDel = contributors.reduce((s, c) => s + c.deletions, 0);

  const contribCards = contributors.map((c, i) => contribCard(c, i, maxC)).join('');
  const hotRows = hot.map((h, i) => hotRow(h, i, maxH)).join('');
  const heatCells = [];
  for (let d = 0; d < 7; d++) {
    heatCells.push(`<div class="heat-day-label">${DAY_LABELS[d]}</div>`);
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.18 + (v / maxHeat) * 0.82;
      heatCells.push(`<div class="heat-cell" data-day="${d}" data-hour="${h}" style="background:rgba(124,58,237,${intensity})" title="${DAY_LABELS[d]}요일 ${h}시 · ${v}건">${v > 0 ? `<span class="heat-num">${v}</span>` : ''}</div>`);
    }
  }
  const hourLabels = Array.from({ length: 24 }, (_, h) =>
    `<div class="heat-hour-label">${h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}</div>`
  ).join('');

  return `
<header>
  <h1>📊 Git Stats Report</h1>
  <div class="meta"><strong>${esc(repo)}</strong> · 분석 시각 ${new Date().toLocaleString('ko-KR')}</div>
</header>

<div class="filter-bar">
  <div class="filter-section">
    <span class="lbl">기간</span>
    <button class="preset" data-days="0">전체</button>
    <button class="preset" data-days="7">최근 7일</button>
    <button class="preset" data-days="30">최근 30일</button>
    <button class="preset active" data-days="90">최근 90일</button>
    <button class="preset" data-days="365">최근 1년</button>
  </div>
  <div class="filter-section">
    <input type="date" id="filter-from">
    <span class="sep">~</span>
    <input type="date" id="filter-to">
  </div>
  <div class="filter-count"><span id="filter-count">${fmt(commits.length)}</span><span class="lbl">commits</span></div>
</div>

<div id="stats-grid" class="stats-grid">
  <div class="stat"><div class="label">총 커밋</div><div class="value">${fmt(commits.length)}</div><div class="desc">분석 대상 커밋 수</div></div>
  <div class="stat"><div class="label">기여자</div><div class="value">${fmt(contributors.length)}</div><div class="desc">고유한 author 수</div></div>
  <div class="stat${bus === 1 ? ' warn' : ''}"><div class="label">Bus Factor</div><div class="value">${bus}</div><div class="desc">${bus === 1 ? '⚠ 1명에게 집중됨' : `${bus}명이 50%+ 점유`}</div></div>
  <div class="stat"><div class="label">변경량</div><div class="value" style="color:#22c55e">+${fmt(totalAdd)}</div><div class="desc"><span style="color:#ef4444">-${fmt(totalDel)}</span> 삭제</div></div>
</div>

<section>
  <h2>👥 기여자 순위 <span class="hint" id="contrib-count">${contributors.length}명</span></h2>
  <div class="h2-hint">이메일 기준으로 집계. 정렬 기준을 바꿔보세요.</div>
  <div class="sort-bar">
    <span class="sort-lbl">정렬</span>
    <button class="sort-chip active" data-sort="commits">커밋 수</button>
    <button class="sort-chip" data-sort="lines">변경 라인</button>
    <button class="sort-chip" data-sort="files">파일 수</button>
    <button class="sort-chip" data-sort="recent">최근 활동</button>
  </div>
  <div class="section-card"><div id="contrib-grid" class="contrib-grid">${contribCards}</div></div>
</section>

<section>
  <h2>🔥 핫스팟 — 가장 자주 수정된 파일</h2>
  <div class="h2-hint">변경 빈도가 높은 파일은 리팩토링 후보이자 버그 위험 지대입니다.</div>
  <div id="hotspots" class="section-card">${hotRows}</div>
</section>

<section>
  <h2>🕐 시간대 히트맵</h2>
  <div class="h2-hint">KST 기준 · 가로축 시간 (00~23시), 세로축 요일. 진한 색일수록 커밋 많음.</div>
  <div class="section-card heat-wrap">
    <div id="global-heatmap" class="heatmap">${heatCells.join('')}</div>
    <div class="heat-hour-row"><div></div>${hourLabels}</div>
    <div class="heat-legend">
      <span>적음</span>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,0.18)"></div>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,0.5)"></div>
      <div class="heat-legend-cell" style="background:rgba(124,58,237,1)"></div>
      <span>많음</span>
      <span style="margin-left:auto;color:var(--dim-2);font-size:11px">셀을 클릭하면 해당 시간대 커밋 목록을 볼 수 있습니다</span>
    </div>
    <div id="heat-detail-mount"></div>
  </div>
</section>

<footer>Generated by <strong>git-stats</strong> · 100 Monetization Ideas</footer>`;
}

function contribCard(c, i, maxC) {
  const seed = c.email || c.author || `${i}`;
  const top = c.topFile ? splitPath(c.topFile) : null;
  const pct = (c.commits / maxC) * 100;
  const myMax = Math.max(1, ...c.heatmap.flat());
  const miniCells = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = c.heatmap[d][h];
      const intensity = v === 0 ? 0 : 0.2 + (v / myMax) * 0.8;
      miniCells.push(`<div class="mini-cell" data-day="${d}" data-hour="${h}" style="background:${v === 0 ? 'var(--bg-2)' : `rgba(124,58,237,${intensity})`}" title="${DAY_LABELS[d]}요일 ${h}시 · ${v}건"></div>`);
    }
  }
  const emailKey = (c.email || c.author || '').toLowerCase();
  return `
  <div class="contrib-card" data-email="${esc(emailKey)}">
    <div class="contrib-rank">#${i + 1}</div>
    <div class="contrib-head">
      <div class="avatar" style="background:${avatarColor(seed)}">${esc(initials(c.author))}</div>
      <div class="contrib-id">
        <div class="contrib-name">${esc(c.author || '(이름 없음)')}</div>
        <div class="contrib-email" title="${esc(c.email)}">${esc(c.email || '(이메일 없음)')}</div>
      </div>
    </div>
    <div class="contrib-big"><div class="big-num">${fmt(c.commits)}</div><div class="big-lbl">commits</div></div>
    <div class="contrib-bar"><div class="contrib-fill" style="width:${pct}%"></div></div>
    <div class="contrib-stats-row"><span class="add">+${fmt(c.additions)}</span><span class="del">−${fmt(c.deletions)}</span></div>
    <div class="contrib-meta">
      <div class="meta-item"><span class="meta-lbl">최근 커밋</span><span class="meta-val" title="${fmtDate(c.lastCommit)}">${timeAgo(c.lastCommit)}</span></div>
      <div class="meta-item"><span class="meta-lbl">첫 커밋</span><span class="meta-val" title="${fmtDate(c.firstCommit)}">${fmtDate(c.firstCommit)}</span></div>
      <div class="meta-item col"><span class="meta-lbl">주력 파일</span>
        ${top ? `<span class="meta-val path" title="${esc(c.topFile)}"><span class="path-dir">${esc(top.dir)}</span><span class="path-name">${esc(top.name)}</span> <span class="path-cnt">×${c.topFileCount}</span></span>` : '<span class="meta-val">—</span>'}
      </div>
    </div>
    <div class="mini-heat-wrap">
      <div class="mini-heat-lbl">활동 패턴 <span class="mini-heat-sub">셀 클릭 · 요일 × 시간 (KST)</span></div>
      <div class="mini-heat">${miniCells.join('')}</div>
      <div class="contrib-detail-mount"></div>
    </div>
  </div>`;
}

function hotRow(h, i, maxH) {
  const pct = (h.touches / maxH) * 100;
  const { dir, name } = splitPath(h.file);
  return `
  <div class="row">
    <span class="rank">${i + 1}</span>
    <div class="row-main">
      <div class="row-title path">${dir ? `<span class="path-dir">${esc(dir)}</span>` : ''}<span class="path-name">${esc(name)}</span></div>
      <div class="row-bar"><div class="row-fill hot" style="width:${pct}%"></div></div>
    </div>
    <div class="row-value">${h.touches}<span class="row-unit">회</span></div>
  </div>`;
}

export const STYLE = `<style>
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
.heat-cell{aspect-ratio:1;min-width:22px;background:var(--bg-3);border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.1s;cursor:pointer}
.heat-cell:hover{transform:scale(1.3);z-index:1;outline:1px solid var(--accent)}
.heat-cell.selected{outline:2px solid #fff;outline-offset:1px;z-index:2}
.heat-num{color:#fff;font-size:10px;font-weight:600;font-family:"SF Mono",Menlo,monospace}
.heat-hour-row{display:grid;grid-template-columns:40px repeat(24,1fr);gap:3px;margin-top:8px}
.heat-hour-label{color:var(--dim-2);font-size:10px;text-align:center;font-family:"SF Mono",Menlo,monospace}
.heat-legend{display:flex;align-items:center;gap:8px;margin-top:16px;color:var(--dim);font-size:12px;justify-content:flex-end}
.heat-legend-cell{width:14px;height:14px;border-radius:2px}
.heat-detail{margin-top:20px;background:var(--bg);border:1px solid var(--accent);border-radius:10px;padding:0;overflow:hidden;animation:slideDown 0.2s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.heat-detail-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--bg-2);border-bottom:1px solid var(--border)}
.heat-detail-title{font-size:14px;color:var(--text);font-weight:600}
.heat-detail-title strong{color:var(--accent-2)}
.heat-detail-close{background:transparent;border:none;color:var(--dim);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1}
.heat-detail-close:hover{color:var(--text);background:var(--bg-3)}
.heat-detail-body{max-height:400px;overflow-y:auto}
.commit-item{display:grid;grid-template-columns:80px 1fr auto;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);align-items:center}
.commit-item:last-child{border-bottom:none}
.commit-item:hover{background:var(--bg-3)}
.commit-hash{font-family:"SF Mono",Menlo,monospace;color:var(--accent-2);font-size:12px}
.commit-main{min-width:0}
.commit-subject{font-size:13px;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.commit-author{font-size:11px;color:var(--dim);font-family:"SF Mono",Menlo,monospace}
.commit-time{font-size:11px;color:var(--dim);text-align:right;white-space:nowrap;font-family:"SF Mono",Menlo,monospace}
footer{text-align:center;color:var(--dim);font-size:12px;padding:32px 0;border-top:1px solid var(--border);margin-top:48px}
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
.mini-cell{border-radius:1px;background:var(--bg-2);min-height:6px;cursor:pointer;transition:transform 0.1s}
.mini-cell:hover{outline:1px solid var(--accent);position:relative;z-index:1}
.mini-cell.selected{outline:2px solid #fff;z-index:2}
.contrib-detail-mount{margin-top:12px}
.contrib-detail{background:var(--bg);border:1px solid var(--accent);border-radius:8px;overflow:hidden;animation:slideDown 0.2s ease}
.contrib-detail .heat-detail-head{padding:10px 14px;font-size:12px}
.contrib-detail .heat-detail-title{font-size:12px}
.contrib-detail .heat-detail-body{max-height:280px}
.contrib-detail .commit-item{grid-template-columns:64px 1fr auto;padding:8px 14px;gap:8px}
.contrib-detail .commit-hash{font-size:11px}
.contrib-detail .commit-subject{font-size:12px}
.contrib-detail .commit-author{font-size:10px}
.contrib-detail .commit-time{font-size:10px}
.filter-bar{background:var(--bg-2);border:1px solid var(--border);border-radius:14px;padding:20px 24px;margin-bottom:32px;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between}
.filter-section{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.filter-section .lbl{color:var(--dim);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px}
.filter-bar input[type=date]{background:var(--bg-3);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:inherit;font-size:13px;color-scheme:dark}
.filter-bar input[type=date]:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.filter-bar .preset{background:var(--bg-3);border:1px solid var(--border);color:var(--dim);padding:7px 14px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;transition:0.15s}
.filter-bar .preset:hover{color:var(--text);border-color:var(--accent)}
.filter-bar .preset.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.filter-bar .filter-count{color:var(--accent-2);font-weight:700;font-size:15px;font-family:"SF Mono",Menlo,monospace}
.filter-bar .filter-count .lbl{margin:0 0 0 4px;font-weight:400}
.filter-bar .sep{color:var(--dim-2);font-size:13px}
.sort-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.sort-lbl{color:var(--dim);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-right:4px}
.sort-chip{background:var(--bg-2);border:1px solid var(--border);color:var(--dim);padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;transition:0.15s}
.sort-chip:hover{color:var(--text);border-color:var(--accent)}
.sort-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
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
</style>`;

export const CLIENT_SCRIPT = `<script>
${clientRuntime.toString()}
clientRuntime();
</script>`;

// 클라이언트에서 실행되는 런타임 (필터·정렬·드릴다운). 함수로 감싸 toString()으로 직렬화.
function clientRuntime() {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  function kstParts(iso){const t=new Date(iso).getTime()+KST_OFFSET_MS;const k=new Date(t);return{day:k.getUTCDay(),hour:k.getUTCHours()};}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmt(n){return n.toLocaleString('ko-KR');}
  function splitPath(p){const i=p.lastIndexOf('/');if(i===-1)return{dir:'',name:p};return{dir:p.slice(0,i+1),name:p.slice(i+1)};}
  function timeAgo(iso){if(!iso)return'—';const d=(Date.now()-new Date(iso).getTime())/1000;if(d<60)return'방금';if(d<3600)return Math.floor(d/60)+'분 전';if(d<86400)return Math.floor(d/3600)+'시간 전';if(d<86400*30)return Math.floor(d/86400)+'일 전';if(d<86400*365)return Math.floor(d/86400/30)+'개월 전';return Math.floor(d/86400/365)+'년 전';}
  function fmtDate(iso){if(!iso)return'—';const d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function initials(name){if(!name)return'?';const p=name.trim().split(/\\s+/);if(p.length===1)return p[0].slice(0,2).toUpperCase();return(p[0][0]+p[p.length-1][0]).toUpperCase();}
  function avatarColor(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return'hsl('+(h%360)+',55%,45%)';}
  const DAY_LABELS=['일','월','화','수','목','금','토'];

  function byContributor(commits){
    const m=new Map();
    for(const c of commits){
      const key=(c.email||c.author||'').toLowerCase();
      const cur=m.get(key)??{email:c.email||'',author:c.author||'',commits:0,additions:0,deletions:0,lastCommit:c.date,firstCommit:c.date,fileCounts:new Map(),heatmap:Array.from({length:7},()=>Array(24).fill(0))};
      cur.commits+=1;cur.additions+=c.additions??0;cur.deletions+=c.deletions??0;
      if(new Date(c.date)>new Date(cur.lastCommit))cur.lastCommit=c.date;
      if(new Date(c.date)<new Date(cur.firstCommit))cur.firstCommit=c.date;
      const{day,hour}=kstParts(c.date);cur.heatmap[day][hour]+=1;
      for(const f of c.filesChanged)cur.fileCounts.set(f,(cur.fileCounts.get(f)??0)+1);
      m.set(key,cur);
    }
    return[...m.values()].map(c=>{let tf='',tc=0,ft=0;for(const[f,n]of c.fileCounts){if(n>tc){tf=f;tc=n;}ft+=n;}return{email:c.email,author:c.author,commits:c.commits,additions:c.additions,deletions:c.deletions,lastCommit:c.lastCommit,firstCommit:c.firstCommit,topFile:tf,topFileCount:tc,filesTouched:ft,heatmap:c.heatmap};}).sort((a,b)=>b.commits-a.commits);
  }
  function sortContribs(contribs,key){
    const fns={commits:(a,b)=>b.commits-a.commits,lines:(a,b)=>(b.additions+b.deletions)-(a.additions+a.deletions),files:(a,b)=>b.filesTouched-a.filesTouched,recent:(a,b)=>new Date(b.lastCommit)-new Date(a.lastCommit)};
    return[...contribs].sort(fns[key]||fns.commits);
  }
  function hotspots(commits,top=20){const m=new Map();for(const c of commits)for(const f of c.filesChanged)m.set(f,(m.get(f)??0)+1);return[...m.entries()].map(([file,touches])=>({file,touches})).sort((a,b)=>b.touches-a.touches).slice(0,top);}
  function busFactor(commits,th=0.5){const m=new Map();for(const c of commits){const k=(c.email||c.author||'').toLowerCase();m.set(k,(m.get(k)??0)+c.filesChanged.length);}const t=[...m.values()].reduce((a,b)=>a+b,0);if(t===0)return 0;const s=[...m.values()].sort((a,b)=>b-a);let a=0;for(let i=0;i<s.length;i++){a+=s[i];if(a/t>=th)return i+1;}return s.length;}
  function heatmap(commits){const g=Array.from({length:7},()=>Array(24).fill(0));for(const c of commits){const{day,hour}=kstParts(c.date);g[day][hour]+=1;}return g;}

  function renderStats(commits,contribs){
    const bus=busFactor(commits);
    const totalAdd=contribs.reduce((s,c)=>s+c.additions,0);
    const totalDel=contribs.reduce((s,c)=>s+c.deletions,0);
    return '<div class="stat"><div class="label">총 커밋</div><div class="value">'+fmt(commits.length)+'</div><div class="desc">필터 적용 후</div></div>'
      +'<div class="stat"><div class="label">기여자</div><div class="value">'+fmt(contribs.length)+'</div><div class="desc">고유 이메일 수</div></div>'
      +'<div class="stat'+(bus===1?' warn':'')+'"><div class="label">Bus Factor</div><div class="value">'+bus+'</div><div class="desc">'+(bus===1?'⚠ 1명에게 집중됨':bus+'명이 50%+ 점유')+'</div></div>'
      +'<div class="stat"><div class="label">변경량</div><div class="value" style="color:#22c55e">+'+fmt(totalAdd)+'</div><div class="desc"><span style="color:#ef4444">-'+fmt(totalDel)+'</span> 삭제</div></div>';
  }
  function renderContribCards(contribs){
    const maxC=Math.max(1,...contribs.map(c=>c.commits));
    return contribs.map((c,i)=>{
      const seed=c.email||c.author||String(i);
      const top=c.topFile?splitPath(c.topFile):null;
      const pct=(c.commits/maxC)*100;
      const myMax=Math.max(1,...c.heatmap.flat());
      const mc=[];
      for(let d=0;d<7;d++)for(let h=0;h<24;h++){const v=c.heatmap[d][h];const it=v===0?0:0.2+(v/myMax)*0.8;mc.push('<div class="mini-cell" data-day="'+d+'" data-hour="'+h+'" style="background:'+(v===0?'var(--bg-2)':'rgba(124,58,237,'+it+')')+'" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건"></div>');}
      const emailKey=(c.email||c.author||'').toLowerCase();
      return '<div class="contrib-card" data-email="'+esc(emailKey)+'"><div class="contrib-rank">#'+(i+1)+'</div><div class="contrib-head"><div class="avatar" style="background:'+avatarColor(seed)+'">'+esc(initials(c.author))+'</div><div class="contrib-id"><div class="contrib-name">'+esc(c.author||'(이름 없음)')+'</div><div class="contrib-email" title="'+esc(c.email)+'">'+esc(c.email||'(이메일 없음)')+'</div></div></div><div class="contrib-big"><div class="big-num">'+fmt(c.commits)+'</div><div class="big-lbl">commits</div></div><div class="contrib-bar"><div class="contrib-fill" style="width:'+pct+'%"></div></div><div class="contrib-stats-row"><span class="add">+'+fmt(c.additions)+'</span><span class="del">−'+fmt(c.deletions)+'</span></div><div class="contrib-meta"><div class="meta-item"><span class="meta-lbl">최근 커밋</span><span class="meta-val" title="'+fmtDate(c.lastCommit)+'">'+timeAgo(c.lastCommit)+'</span></div><div class="meta-item"><span class="meta-lbl">첫 커밋</span><span class="meta-val" title="'+fmtDate(c.firstCommit)+'">'+fmtDate(c.firstCommit)+'</span></div><div class="meta-item col"><span class="meta-lbl">주력 파일</span>'+(top?'<span class="meta-val path" title="'+esc(c.topFile)+'"><span class="path-dir">'+esc(top.dir)+'</span><span class="path-name">'+esc(top.name)+'</span> <span class="path-cnt">×'+c.topFileCount+'</span></span>':'<span class="meta-val">—</span>')+'</div></div><div class="mini-heat-wrap"><div class="mini-heat-lbl">활동 패턴 <span class="mini-heat-sub">셀 클릭 · 요일 × 시간 (KST)</span></div><div class="mini-heat">'+mc.join('')+'</div><div class="contrib-detail-mount"></div></div></div>';
    }).join('');
  }
  function renderHotspots(hot){
    const maxH=Math.max(1,...hot.map(h=>h.touches));
    return hot.map((h,i)=>{const pct=(h.touches/maxH)*100;const{dir,name}=splitPath(h.file);return '<div class="row"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path">'+(dir?'<span class="path-dir">'+esc(dir)+'</span>':'')+'<span class="path-name">'+esc(name)+'</span></div><div class="row-bar"><div class="row-fill hot" style="width:'+pct+'%"></div></div></div><div class="row-value">'+h.touches+'<span class="row-unit">회</span></div></div>';}).join('');
  }
  function renderHeatmap(grid){
    const maxH=Math.max(1,...grid.flat());
    const cells=[];
    for(let d=0;d<7;d++){
      cells.push('<div class="heat-day-label">'+DAY_LABELS[d]+'</div>');
      for(let h=0;h<24;h++){const v=grid[d][h];const it=v===0?0:0.18+(v/maxH)*0.82;cells.push('<div class="heat-cell" data-day="'+d+'" data-hour="'+h+'" style="background:rgba(124,58,237,'+it+')" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건">'+(v>0?'<span class="heat-num">'+v+'</span>':'')+'</div>');}
    }
    return cells.join('');
  }

  const ALL_COMMITS=JSON.parse(document.getElementById('commit-data').textContent);
  const dates=ALL_COMMITS.map(c=>c.date.slice(0,10)).sort();
  const MIN_DATE=dates[0]||'';
  const MAX_DATE=dates[dates.length-1]||'';
  const fromEl=document.getElementById('filter-from');
  const toEl=document.getElementById('filter-to');
  fromEl.min=MIN_DATE;fromEl.max=MAX_DATE;toEl.min=MIN_DATE;toEl.max=MAX_DATE;
  const today=new Date();
  const ninetyAgo=new Date(today.getTime()-90*86400*1000);
  const defFrom=ninetyAgo.toISOString().slice(0,10);
  const defTo=today.toISOString().slice(0,10);
  fromEl.value=defFrom<MIN_DATE?MIN_DATE:defFrom;
  toEl.value=defTo>MAX_DATE?MAX_DATE:defTo;

  let currentSort='commits';
  let currentFiltered=[];

  function renderCommitList(day,hour,commits,emailFilter){
    const items=commits.filter(c=>{if(emailFilter&&(c.email||c.author||'').toLowerCase()!==emailFilter)return false;const k=kstParts(c.date);return k.day===day&&k.hour===hour;}).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!items.length)return'';
    const rows=items.map(c=>{const d=new Date(new Date(c.date).getTime()+KST_OFFSET_MS);const mm=String(d.getUTCMonth()+1).padStart(2,'0');const dd=String(d.getUTCDate()).padStart(2,'0');const hh=String(d.getUTCHours()).padStart(2,'0');const mi=String(d.getUTCMinutes()).padStart(2,'0');return '<div class="commit-item"><span class="commit-hash">'+esc(c.hash.slice(0,7))+'</span><div class="commit-main"><div class="commit-subject">'+esc(c.subject||'(no message)')+'</div><div class="commit-author">'+esc(c.author||'')+' &lt;'+esc(c.email||'')+'&gt;</div></div><div class="commit-time">'+mm+'-'+dd+' '+hh+':'+mi+'</div></div>';}).join('');
    return '<div class="heat-detail"><div class="heat-detail-head"><div class="heat-detail-title">'+DAY_LABELS[day]+'요일 <strong>'+String(hour).padStart(2,'0')+':00 ~ '+String(hour).padStart(2,'0')+':59</strong> · '+items.length+'개 커밋</div><button class="heat-detail-close" aria-label="닫기">×</button></div><div class="heat-detail-body">'+rows+'</div></div>';
  }

  const cardSelections=new WeakMap();
  function bindContribCells(){
    document.querySelectorAll('#contrib-grid .contrib-card').forEach(card=>{
      const email=card.dataset.email;
      const mount=card.querySelector('.contrib-detail-mount');
      card.querySelectorAll('.mini-cell').forEach(cell=>{
        cell.addEventListener('click',e=>{
          e.stopPropagation();
          const day=parseInt(cell.dataset.day,10);const hour=parseInt(cell.dataset.hour,10);
          const prev=cardSelections.get(card);
          if(prev===cell){cell.classList.remove('selected');cardSelections.delete(card);mount.innerHTML='';return;}
          card.querySelectorAll('.mini-cell.selected').forEach(c=>c.classList.remove('selected'));
          cell.classList.add('selected');cardSelections.set(card,cell);
          const html=renderCommitList(day,hour,currentFiltered,email);
          if(!html){mount.innerHTML='';return;}
          mount.innerHTML=html.replace('class="heat-detail"','class="heat-detail contrib-detail"');
          const closeBtn=mount.querySelector('.heat-detail-close');
          if(closeBtn)closeBtn.addEventListener('click',()=>{cell.classList.remove('selected');cardSelections.delete(card);mount.innerHTML='';});
        });
      });
    });
  }

  let selectedCell=null;
  function bindHeatmapCells(){
    document.querySelectorAll('#global-heatmap .heat-cell').forEach(cell=>{
      cell.addEventListener('click',()=>{
        const day=parseInt(cell.dataset.day,10);const hour=parseInt(cell.dataset.hour,10);
        const mount=document.getElementById('heat-detail-mount');
        if(selectedCell===cell){cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';return;}
        document.querySelectorAll('#global-heatmap .heat-cell.selected').forEach(c=>c.classList.remove('selected'));
        cell.classList.add('selected');selectedCell=cell;
        mount.innerHTML=renderCommitList(day,hour,currentFiltered);
        const closeBtn=mount.querySelector('.heat-detail-close');
        if(closeBtn)closeBtn.addEventListener('click',()=>{cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';});
      });
    });
  }

  function apply(){
    const from=fromEl.value;const to=toEl.value;
    const filtered=ALL_COMMITS.filter(c=>{const d=c.date.slice(0,10);return(!from||d>=from)&&(!to||d<=to);});
    currentFiltered=filtered;
    const contribs=sortContribs(byContributor(filtered),currentSort);
    document.getElementById('filter-count').textContent=fmt(filtered.length);
    document.getElementById('contrib-count').textContent=contribs.length+'명';
    document.getElementById('stats-grid').innerHTML=renderStats(filtered,contribs);
    document.getElementById('contrib-grid').innerHTML=renderContribCards(contribs);
    document.getElementById('hotspots').innerHTML=renderHotspots(hotspots(filtered,20));
    document.getElementById('global-heatmap').innerHTML=renderHeatmap(heatmap(filtered));
    document.getElementById('heat-detail-mount').innerHTML='';
    selectedCell=null;
    bindHeatmapCells();bindContribCells();
  }

  function clearPresets(){document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));}
  fromEl.addEventListener('change',()=>{clearPresets();apply();});
  toEl.addEventListener('change',()=>{clearPresets();apply();});
  document.querySelectorAll('.preset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      clearPresets();btn.classList.add('active');
      const days=parseInt(btn.dataset.days,10);
      if(days===0){fromEl.value=MIN_DATE;toEl.value=MAX_DATE;}
      else{const t=new Date();const f=new Date(t.getTime()-days*86400*1000);fromEl.value=f.toISOString().slice(0,10);toEl.value=t.toISOString().slice(0,10);}
      apply();
    });
  });
  document.querySelectorAll('.sort-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.sort-chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentSort=btn.dataset.sort;apply();});
  });
  apply();
}
