// git-stats HTML 렌더러.
//
// 두 가지 사용처:
//  1) CLI 단일 파일 모드 — renderHtml(): 전체 커밋을 페이지에 임베드, 클라가 재집계.
//     (작은~중형 저장소용. 오프라인 파일 하나로 완결.)
//  2) 서버 모드 — renderShell() + render*Html() 조각들: 서버가 집계해 HTML 조각을
//     /api/report 응답에 담아 보내고, 클라는 주입만. 카드는 Top N만 그려 대형 저장소도 빠름.
import { byContributor, hotspots, busFactor, heatmap } from './core.mjs';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const CONTRIB_PAGE = 50; // 기여자 카드 1회 렌더 개수 (대형 저장소 DOM 폭발 방지)

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
function kstParts(iso) {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}

// 정렬 (서버·클라 공용 키)
function sortContribs(contribs, key) {
  const fns = {
    commits: (a, b) => b.commits - a.commits,
    lines: (a, b) => (b.additions + b.deletions) - (a.additions + a.deletions),
    files: (a, b) => b.filesTouched - a.filesTouched,
    recent: (a, b) => new Date(b.lastCommit) - new Date(a.lastCommit),
  };
  return [...contribs].sort(fns[key] || fns.commits);
}

// ─────────── HTML 조각 (집계 결과 → HTML). 서버가 호출. ───────────
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

/** 기여자 카드 묶음 (offset부터 CONTRIB_PAGE개). maxC는 1위 커밋수(막대 정규화용). */
export function renderContribCardsHtml(contributors, offset, maxC) {
  return contributors.slice(offset, offset + CONTRIB_PAGE)
    .map((c, k) => contribCard(c, offset + k, maxC)).join('');
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
export function renderHotspotsHtml(hot) {
  const maxH = Math.max(1, ...hot.map((h) => h.touches));
  return hot.map((h, i) => hotRow(h, i, maxH)).join('');
}

export function renderHeatmapHtml(grid) {
  const maxHeat = Math.max(1, ...grid.flat());
  const cells = [];
  for (let d = 0; d < 7; d++) {
    cells.push(`<div class="heat-day-label">${DAY_LABELS[d]}</div>`);
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.18 + (v / maxHeat) * 0.82;
      cells.push(`<div class="heat-cell" data-day="${d}" data-hour="${h}" style="background:rgba(124,58,237,${intensity})" title="${DAY_LABELS[d]}요일 ${h}시 · ${v}건">${v > 0 ? `<span class="heat-num">${v}</span>` : ''}</div>`);
    }
  }
  return cells.join('');
}

export function renderStatsHtml(totalCommits, contribCount, bus, totalAdd, totalDel) {
  return `
    <div class="stat"><div class="label">총 커밋</div><div class="value">${fmt(totalCommits)}</div><div class="desc">필터 적용 후</div></div>
    <div class="stat"><div class="label">기여자</div><div class="value">${fmt(contribCount)}</div><div class="desc">고유 이메일 수</div></div>
    <div class="stat${bus === 1 ? ' warn' : ''}"><div class="label">Bus Factor</div><div class="value">${bus}</div><div class="desc">${bus === 1 ? '⚠ 1명에게 집중됨' : `${bus}명이 50%+ 점유`}</div></div>
    <div class="stat"><div class="label">변경량</div><div class="value" style="color:#22c55e">+${fmt(totalAdd)}</div><div class="desc"><span style="color:#ef4444">-${fmt(totalDel)}</span> 삭제</div></div>`;
}

/** 드릴다운: 특정 시간대 커밋 목록 (이미 필터된 커밋 배열을 받음). */
export function renderCommitListHtml(day, hour, items) {
  if (!items.length) return '';
  const rows = items.map((c) => {
    const d = new Date(new Date(c.date).getTime() + KST_OFFSET_MS);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return `<div class="commit-item"><span class="commit-hash">${esc(c.hash.slice(0, 7))}</span><div class="commit-main"><div class="commit-subject">${esc(c.subject || '(no message)')}</div><div class="commit-author">${esc(c.author || '')} &lt;${esc(c.email || '')}&gt;</div></div><div class="commit-time">${mm}-${dd} ${hh}:${mi}</div></div>`;
  }).join('');
  return `<div class="heat-detail"><div class="heat-detail-head"><div class="heat-detail-title">${DAY_LABELS[day]}요일 <strong>${String(hour).padStart(2, '0')}:00 ~ ${String(hour).padStart(2, '0')}:59</strong> · ${items.length}개 커밋</div><button class="heat-detail-close" aria-label="닫기">×</button></div><div class="heat-detail-body">${rows}</div></div>`;
}

/**
 * 서버 집계 진입점: 커밋 배열 → /api/report 응답 페이로드.
 * sort/contribOffset에 따라 카드 조각을 만들어 보낸다. 커밋 원본은 포함하지 않음.
 */
export function buildReportPayload(commits, { sort = 'commits', contribOffset = 0 } = {}) {
  const contributors = sortContribs(byContributor(commits), sort);
  const hot = hotspots(commits, 20);
  const bus = busFactor(commits);
  const grid = heatmap(commits);
  const maxC = Math.max(1, ...contributors.map((c) => c.commits));
  const totalAdd = contributors.reduce((s, c) => s + c.additions, 0);
  const totalDel = contributors.reduce((s, c) => s + c.deletions, 0);
  return {
    totalCommits: commits.length,
    contribCount: contributors.length,
    statsHtml: renderStatsHtml(commits.length, contributors.length, bus, totalAdd, totalDel),
    contribCardsHtml: renderContribCardsHtml(contributors, contribOffset, maxC),
    contribHasMore: contributors.length > contribOffset + CONTRIB_PAGE,
    contribNextOffset: contribOffset + CONTRIB_PAGE,
    hotspotsHtml: renderHotspotsHtml(hot),
    heatmapHtml: renderHeatmapHtml(grid),
  };
}

// ─────────── 페이지 골격 (필터바 + 빈 컨테이너 + 클라 런타임) ───────────
// CLI 단일 파일 모드와 서버 모드가 공유. mode='embedded' | 'server'.
export function renderShell(repo, { mode, minDate = '', maxDate = '', totalCommits = 0 } = {}) {
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
  <div class="filter-count"><span id="filter-count">${fmt(totalCommits)}</span><span class="lbl">commits</span></div>
</div>

<div id="stats-grid" class="stats-grid"></div>

<section>
  <h2>👥 기여자 순위 <span class="hint" id="contrib-count"></span></h2>
  <div class="h2-hint">이메일 기준으로 집계. 정렬 기준을 바꿔보세요. <span id="contrib-shown" style="color:var(--dim-2)"></span></div>
  <div class="sort-bar">
    <span class="sort-lbl">정렬</span>
    <button class="sort-chip active" data-sort="commits">커밋 수</button>
    <button class="sort-chip" data-sort="lines">변경 라인</button>
    <button class="sort-chip" data-sort="files">파일 수</button>
    <button class="sort-chip" data-sort="recent">최근 활동</button>
  </div>
  <div class="section-card"><div id="contrib-grid" class="contrib-grid"></div></div>
  <div id="contrib-more-wrap" style="text-align:center;margin-top:16px;display:none">
    <button class="btn ghost" id="contrib-more">더 보기</button>
  </div>
</section>

<section>
  <h2>🔥 핫스팟 — 가장 자주 수정된 파일</h2>
  <div class="h2-hint">변경 빈도가 높은 파일은 리팩토링 후보이자 버그 위험 지대입니다.</div>
  <div id="hotspots" class="section-card"></div>
</section>

<section>
  <h2>🕐 시간대 히트맵</h2>
  <div class="h2-hint">KST 기준 · 가로축 시간 (00~23시), 세로축 요일. 진한 색일수록 커밋 많음.</div>
  <div class="section-card heat-wrap">
    <div id="global-heatmap" class="heatmap"></div>
    <div class="heat-hour-row"><div></div>${Array.from({ length: 24 }, (_, h) => `<div class="heat-hour-label">${h % 3 === 0 ? String(h).padStart(2, '0') : ''}</div>`).join('')}</div>
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

<footer>Generated by <strong>git-stats</strong> · 100 Monetization Ideas</footer>
<script id="report-config" type="application/json">${JSON.stringify({ mode, repo, minDate, maxDate }).replace(/</g, '\\u003c')}</script>`;
}

// ─────────── CLI 단일 파일 모드 ───────────
// 전체 커밋을 임베드하고 클라가 재집계. 큰 저장소는 카드 Top N으로 제한되지만
// 임베드 자체가 커지므로, 서버 모드(renderShell+API)를 권장.
export function renderHtml(repo, commits, topN = 20) {
  const dates = commits.map((c) => c.date.slice(0, 10)).sort();
  const shell = renderShell(repo, {
    mode: 'embedded',
    minDate: dates[0] || '',
    maxDate: dates[dates.length - 1] || '',
    totalCommits: commits.length,
  });
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>Git Stats · ${esc(repo)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
${STYLE}</head><body><div class="container">
${shell}
</div>
<script id="commit-data" type="application/json">${JSON.stringify(commits).replace(/</g, '\\u003c')}</script>
${CLIENT_SCRIPT}
</body></html>`;
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
.btn{background:var(--accent);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:0.15s}
.btn:hover{background:#8b4ff0}
.btn.ghost{background:var(--bg-3);color:var(--dim);border:1px solid var(--border)}
.btn.ghost:hover{color:var(--text);border-color:var(--accent)}
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
.loading{text-align:center;color:var(--dim);padding:40px;font-size:14px}
.spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(124,58,237,0.3);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:-3px;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
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

// 클라이언트 런타임. embedded 모드는 임베드된 커밋으로 재집계,
// server 모드는 /api/report·/api/commits-at 호출. 함수로 감싸 toString()으로 직렬화.
function clientRuntime() {
  const cfg = JSON.parse(document.getElementById('report-config').textContent);
  const MODE = cfg.mode;
  const REPO = cfg.repo;
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
  const CONTRIB_PAGE = 50;
  function kstParts(iso){const t=new Date(iso).getTime()+KST_OFFSET_MS;const k=new Date(t);return{day:k.getUTCDay(),hour:k.getUTCHours()};}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmt(n){return n.toLocaleString('ko-KR');}
  function splitPath(p){const i=p.lastIndexOf('/');if(i===-1)return{dir:'',name:p};return{dir:p.slice(0,i+1),name:p.slice(i+1)};}
  function timeAgo(iso){if(!iso)return'—';const d=(Date.now()-new Date(iso).getTime())/1000;if(d<60)return'방금';if(d<3600)return Math.floor(d/60)+'분 전';if(d<86400)return Math.floor(d/3600)+'시간 전';if(d<86400*30)return Math.floor(d/86400)+'일 전';if(d<86400*365)return Math.floor(d/86400/30)+'개월 전';return Math.floor(d/86400/365)+'년 전';}
  function fmtDate(iso){if(!iso)return'—';const d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function initials(name){if(!name)return'?';const p=name.trim().split(/\\s+/);if(p.length===1)return p[0].slice(0,2).toUpperCase();return(p[0][0]+p[p.length-1][0]).toUpperCase();}
  function avatarColor(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return'hsl('+(h%360)+',55%,45%)';}

  // ── embedded 모드용 집계 (클라 재집계) ──
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
    return[...m.values()].map(c=>{let tf='',tc=0,ft=0;for(const[f,n]of c.fileCounts){if(n>tc){tf=f;tc=n;}ft+=n;}return{email:c.email,author:c.author,commits:c.commits,additions:c.additions,deletions:c.deletions,lastCommit:c.lastCommit,firstCommit:c.firstCommit,topFile:tf,topFileCount:tc,filesTouched:ft,heatmap:c.heatmap};});
  }
  function sortContribs(contribs,key){const fns={commits:(a,b)=>b.commits-a.commits,lines:(a,b)=>(b.additions+b.deletions)-(a.additions+a.deletions),files:(a,b)=>b.filesTouched-a.filesTouched,recent:(a,b)=>new Date(b.lastCommit)-new Date(a.lastCommit)};return[...contribs].sort(fns[key]||fns.commits);}
  function hotspots(commits,top){const m=new Map();for(const c of commits)for(const f of c.filesChanged)m.set(f,(m.get(f)??0)+1);return[...m.entries()].map(([file,touches])=>({file,touches})).sort((a,b)=>b.touches-a.touches).slice(0,top||20);}
  function busFactor(commits,th){th=th||0.5;const m=new Map();for(const c of commits){const k=(c.email||c.author||'').toLowerCase();m.set(k,(m.get(k)??0)+c.filesChanged.length);}const t=[...m.values()].reduce((a,b)=>a+b,0);if(t===0)return 0;const s=[...m.values()].sort((a,b)=>b-a);let a=0;for(let i=0;i<s.length;i++){a+=s[i];if(a/t>=th)return i+1;}return s.length;}
  function heatmap(commits){const g=Array.from({length:7},()=>Array(24).fill(0));for(const c of commits){const{day,hour}=kstParts(c.date);g[day][hour]+=1;}return g;}

  function statsHtml(total,cc,bus,add,del){return '<div class="stat"><div class="label">총 커밋</div><div class="value">'+fmt(total)+'</div><div class="desc">필터 적용 후</div></div><div class="stat"><div class="label">기여자</div><div class="value">'+fmt(cc)+'</div><div class="desc">고유 이메일 수</div></div><div class="stat'+(bus===1?' warn':'')+'"><div class="label">Bus Factor</div><div class="value">'+bus+'</div><div class="desc">'+(bus===1?'⚠ 1명에게 집중됨':bus+'명이 50%+ 점유')+'</div></div><div class="stat"><div class="label">변경량</div><div class="value" style="color:#22c55e">+'+fmt(add)+'</div><div class="desc"><span style="color:#ef4444">-'+fmt(del)+'</span> 삭제</div></div>';}
  function contribCardHtml(c,i,maxC){
    const seed=c.email||c.author||String(i);const top=c.topFile?splitPath(c.topFile):null;const pct=(c.commits/maxC)*100;
    const myMax=Math.max(1,...c.heatmap.flat());const mc=[];
    for(let d=0;d<7;d++)for(let h=0;h<24;h++){const v=c.heatmap[d][h];const it=v===0?0:0.2+(v/myMax)*0.8;mc.push('<div class="mini-cell" data-day="'+d+'" data-hour="'+h+'" style="background:'+(v===0?'var(--bg-2)':'rgba(124,58,237,'+it+')')+'" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건"></div>');}
    const emailKey=(c.email||c.author||'').toLowerCase();
    return '<div class="contrib-card" data-email="'+esc(emailKey)+'"><div class="contrib-rank">#'+(i+1)+'</div><div class="contrib-head"><div class="avatar" style="background:'+avatarColor(seed)+'">'+esc(initials(c.author))+'</div><div class="contrib-id"><div class="contrib-name">'+esc(c.author||'(이름 없음)')+'</div><div class="contrib-email" title="'+esc(c.email)+'">'+esc(c.email||'(이메일 없음)')+'</div></div></div><div class="contrib-big"><div class="big-num">'+fmt(c.commits)+'</div><div class="big-lbl">commits</div></div><div class="contrib-bar"><div class="contrib-fill" style="width:'+pct+'%"></div></div><div class="contrib-stats-row"><span class="add">+'+fmt(c.additions)+'</span><span class="del">−'+fmt(c.deletions)+'</span></div><div class="contrib-meta"><div class="meta-item"><span class="meta-lbl">최근 커밋</span><span class="meta-val" title="'+fmtDate(c.lastCommit)+'">'+timeAgo(c.lastCommit)+'</span></div><div class="meta-item"><span class="meta-lbl">첫 커밋</span><span class="meta-val" title="'+fmtDate(c.firstCommit)+'">'+fmtDate(c.firstCommit)+'</span></div><div class="meta-item col"><span class="meta-lbl">주력 파일</span>'+(top?'<span class="meta-val path" title="'+esc(c.topFile)+'"><span class="path-dir">'+esc(top.dir)+'</span><span class="path-name">'+esc(top.name)+'</span> <span class="path-cnt">×'+c.topFileCount+'</span></span>':'<span class="meta-val">—</span>')+'</div></div><div class="mini-heat-wrap"><div class="mini-heat-lbl">활동 패턴 <span class="mini-heat-sub">셀 클릭 · 요일 × 시간 (KST)</span></div><div class="mini-heat">'+mc.join('')+'</div><div class="contrib-detail-mount"></div></div></div>';
  }
  function hotspotsHtml(hot){const maxH=Math.max(1,...hot.map(h=>h.touches));return hot.map((h,i)=>{const pct=(h.touches/maxH)*100;const{dir,name}=splitPath(h.file);return '<div class="row"><span class="rank">'+(i+1)+'</span><div class="row-main"><div class="row-title path">'+(dir?'<span class="path-dir">'+esc(dir)+'</span>':'')+'<span class="path-name">'+esc(name)+'</span></div><div class="row-bar"><div class="row-fill hot" style="width:'+pct+'%"></div></div></div><div class="row-value">'+h.touches+'<span class="row-unit">회</span></div></div>';}).join('');}
  function heatmapHtml(grid){const maxH=Math.max(1,...grid.flat());const cells=[];for(let d=0;d<7;d++){cells.push('<div class="heat-day-label">'+DAY_LABELS[d]+'</div>');for(let h=0;h<24;h++){const v=grid[d][h];const it=v===0?0:0.18+(v/maxH)*0.82;cells.push('<div class="heat-cell" data-day="'+d+'" data-hour="'+h+'" style="background:rgba(124,58,237,'+it+')" title="'+DAY_LABELS[d]+'요일 '+h+'시 · '+v+'건">'+(v>0?'<span class="heat-num">'+v+'</span>':'')+'</div>');}}return cells.join('');}
  function commitListHtml(day,hour,items,total,truncated){if(!items.length)return'';total=total||items.length;const rows=items.map(c=>{const d=new Date(new Date(c.date).getTime()+KST_OFFSET_MS);const mm=String(d.getUTCMonth()+1).padStart(2,'0');const dd=String(d.getUTCDate()).padStart(2,'0');const hh=String(d.getUTCHours()).padStart(2,'0');const mi=String(d.getUTCMinutes()).padStart(2,'0');return '<div class="commit-item"><span class="commit-hash">'+esc(c.hash.slice(0,7))+'</span><div class="commit-main"><div class="commit-subject">'+esc(c.subject||'(no message)')+'</div><div class="commit-author">'+esc(c.author||'')+' &lt;'+esc(c.email||'')+'&gt;</div></div><div class="commit-time">'+mm+'-'+dd+' '+hh+':'+mi+'</div></div>';}).join('');const cap=truncated?(' · 최신 '+items.length+'개 표시'):'';return '<div class="heat-detail"><div class="heat-detail-head"><div class="heat-detail-title">'+DAY_LABELS[day]+'요일 <strong>'+String(hour).padStart(2,'0')+':00 ~ '+String(hour).padStart(2,'0')+':59</strong> · '+total+'개 커밋'+cap+'</div><button class="heat-detail-close" aria-label="닫기">×</button></div><div class="heat-detail-body">'+rows+'</div></div>';}

  // ── 공통 상태 ──
  const $=(s)=>document.querySelector(s);
  let currentSort='commits';
  let contribOffset=0;
  let contribTotal=0;
  let contribMaxC=1; // embedded: 1위 커밋수
  let allContribsSorted=[]; // embedded only
  // embedded 전용
  let ALL_COMMITS=[], currentFiltered=[];
  // server 전용 캐시: 드릴다운 결과
  let lastFilter={from:'',to:''};

  // 날짜 범위 초기화
  const fromEl=$('#filter-from'),toEl=$('#filter-to');
  fromEl.min=cfg.minDate;fromEl.max=cfg.maxDate;toEl.min=cfg.minDate;toEl.max=cfg.maxDate;
  const today=new Date();const ninety=new Date(today.getTime()-90*86400*1000);
  let dFrom=ninety.toISOString().slice(0,10);let dTo=today.toISOString().slice(0,10);
  fromEl.value=dFrom<cfg.minDate?cfg.minDate:dFrom;
  toEl.value=dTo>cfg.maxDate?cfg.maxDate:dTo;

  function setBusy(b){const g=$('#contrib-grid');if(b)g.innerHTML='<div class="loading"><span class="spin"></span>집계 중…</div>';}

  // ── 드릴다운 바인딩 (공통) ──
  let selectedCell=null;
  function bindHeatmapCells(){
    document.querySelectorAll('#global-heatmap .heat-cell').forEach(cell=>{
      cell.addEventListener('click',async()=>{
        const day=+cell.dataset.day,hour=+cell.dataset.hour;const mount=$('#heat-detail-mount');
        if(selectedCell===cell){cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';return;}
        document.querySelectorAll('#global-heatmap .heat-cell.selected').forEach(c=>c.classList.remove('selected'));
        cell.classList.add('selected');selectedCell=cell;
        mount.innerHTML='<div class="loading"><span class="spin"></span>커밋 불러오는 중…</div>';
        const{items,total,truncated}=await commitsAt(day,hour,'');
        mount.innerHTML=commitListHtml(day,hour,items,total,truncated)||'<div class="loading">커밋 없음</div>';
        const cb=mount.querySelector('.heat-detail-close');if(cb)cb.onclick=()=>{cell.classList.remove('selected');selectedCell=null;mount.innerHTML='';};
      });
    });
  }
  const cardSel=new WeakMap();
  function bindContribCells(){
    document.querySelectorAll('#contrib-grid .contrib-card').forEach(card=>{
      const email=card.dataset.email;const mount=card.querySelector('.contrib-detail-mount');
      card.querySelectorAll('.mini-cell').forEach(cell=>{
        cell.addEventListener('click',async(e)=>{
          e.stopPropagation();const day=+cell.dataset.day,hour=+cell.dataset.hour;const prev=cardSel.get(card);
          if(prev===cell){cell.classList.remove('selected');cardSel.delete(card);mount.innerHTML='';return;}
          card.querySelectorAll('.mini-cell.selected').forEach(c=>c.classList.remove('selected'));
          cell.classList.add('selected');cardSel.set(card,cell);
          mount.innerHTML='<div class="loading"><span class="spin"></span>…</div>';
          const{items,total,truncated}=await commitsAt(day,hour,email);
          const html=commitListHtml(day,hour,items,total,truncated);mount.innerHTML=html?html.replace('class="heat-detail"','class="heat-detail contrib-detail"'):'';
          const cb=mount.querySelector('.heat-detail-close');if(cb)cb.onclick=()=>{cell.classList.remove('selected');cardSel.delete(card);mount.innerHTML='';};
        });
      });
    });
  }

  // ── 모드별 데이터 소스 ── ({items, total, truncated} 반환)
  async function commitsAt(day,hour,email){
    if(MODE==='embedded'){
      const items=currentFiltered.filter(c=>{if(email&&(c.email||c.author||'').toLowerCase()!==email)return false;const k=kstParts(c.date);return k.day===day&&k.hour===hour;}).sort((a,b)=>new Date(b.date)-new Date(a.date));
      return{items,total:items.length,truncated:false};
    }
    const u=new URL('/api/commits-at',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('day',day);u.searchParams.set('hour',hour);
    if(email)u.searchParams.set('email',email);
    u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    applyServerOpts(u);
    try{const r=await fetch(u);const d=await r.json();return{items:d.commits||[],total:d.count||0,truncated:!!d.truncated};}catch(e){return{items:[],total:0,truncated:false};}
  }

  function applyServerOpts(u){
    // serve.mjs가 페이지를 줄 때 report-config에 옵션을 넣어두면 여기서 전달.
    if(cfg.opts){for(const k in cfg.opts){if(cfg.opts[k])u.searchParams.set(k,cfg.opts[k]);}}
  }

  // ── 렌더 (서버/클라 공통 진입) ──
  async function refresh(resetOffset){
    if(resetOffset!==false)contribOffset=0;
    if(MODE==='embedded'){
      const from=fromEl.value,to=toEl.value;
      currentFiltered=ALL_COMMITS.filter(c=>{const d=c.date.slice(0,10);return(!from||d>=from)&&(!to||d<=to);});
      const contribs=sortContribs(byContributor(currentFiltered),currentSort);
      allContribsSorted=contribs;contribTotal=contribs.length;contribMaxC=Math.max(1,...contribs.map(c=>c.commits));
      const bus=busFactor(currentFiltered);const add=contribs.reduce((s,c)=>s+c.additions,0),del=contribs.reduce((s,c)=>s+c.deletions,0);
      $('#filter-count').textContent=fmt(currentFiltered.length);
      $('#contrib-count').textContent=contribTotal+'명';
      $('#stats-grid').innerHTML=statsHtml(currentFiltered.length,contribTotal,bus,add,del);
      $('#contrib-grid').innerHTML=contribs.slice(0,CONTRIB_PAGE).map((c,i)=>contribCardHtml(c,i,contribMaxC)).join('');
      $('#hotspots').innerHTML=hotspotsHtml(hotspots(currentFiltered,20));
      $('#global-heatmap').innerHTML=heatmapHtml(heatmap(currentFiltered));
      updateMore();finishRender();
      return;
    }
    // server 모드
    setBusy(true);
    const u=new URL('/api/report',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    u.searchParams.set('sort',currentSort);u.searchParams.set('offset','0');
    applyServerOpts(u);
    let d;try{const r=await fetch(u);d=await r.json();}catch(e){$('#contrib-grid').innerHTML='<div class="loading">서버 오류: '+e.message+'</div>';return;}
    if(d.error){$('#contrib-grid').innerHTML='<div class="loading">'+d.error+'</div>';return;}
    contribTotal=d.contribCount;
    $('#filter-count').textContent=fmt(d.totalCommits);
    $('#contrib-count').textContent=d.contribCount+'명';
    $('#stats-grid').innerHTML=d.statsHtml;
    $('#contrib-grid').innerHTML=d.contribCardsHtml;
    $('#hotspots').innerHTML=d.hotspotsHtml;
    $('#global-heatmap').innerHTML=d.heatmapHtml;
    contribOffset=d.contribNextOffset;
    setMore(d.contribHasMore);
    finishRender();
  }

  function setMore(hasMore){
    const w=$('#contrib-more-wrap');w.style.display=hasMore?'block':'none';
    const shown=Math.min(contribOffset,contribTotal);
    $('#contrib-shown').textContent='('+shown+' / '+contribTotal+'명 표시'+(contribTotal>shown?' · 더 보기로 추가':'')+')';
  }
  function updateMore(){ // embedded
    const cnt=contribGridCount();
    $('#contrib-more-wrap').style.display=cnt<contribTotal?'block':'none';
    $('#contrib-shown').textContent='('+cnt+' / '+contribTotal+'명 표시'+(contribTotal>cnt?' · 더 보기로 추가':'')+')';
  }
  function contribGridCount(){return document.querySelectorAll('#contrib-grid .contrib-card').length;}

  async function loadMore(){
    if(MODE==='embedded'){
      const cnt=contribGridCount();const next=allContribsSorted.slice(cnt,cnt+CONTRIB_PAGE);
      $('#contrib-grid').insertAdjacentHTML('beforeend',next.map((c,i)=>contribCardHtml(c,cnt+i,contribMaxC)).join(''));
      updateMore();bindContribCells();
      return;
    }
    const u=new URL('/api/report',location.origin);
    u.searchParams.set('repo',REPO);u.searchParams.set('from',fromEl.value);u.searchParams.set('to',toEl.value);
    u.searchParams.set('sort',currentSort);u.searchParams.set('offset',String(contribOffset));
    applyServerOpts(u);
    let d;try{const r=await fetch(u);d=await r.json();}catch(e){return;}
    if(d.error)return;
    $('#contrib-grid').insertAdjacentHTML('beforeend',d.contribCardsHtml);
    contribOffset=d.contribNextOffset;setMore(d.contribHasMore);bindContribCells();
  }

  function finishRender(){$('#heat-detail-mount').innerHTML='';selectedCell=null;bindHeatmapCells();bindContribCells();}

  // ── 이벤트 ──
  function clearPresets(){document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));}
  fromEl.addEventListener('change',()=>{clearPresets();refresh();});
  toEl.addEventListener('change',()=>{clearPresets();refresh();});
  document.querySelectorAll('.preset').forEach(btn=>{
    btn.addEventListener('click',()=>{clearPresets();btn.classList.add('active');const days=+btn.dataset.days;
      if(days===0){fromEl.value=cfg.minDate;toEl.value=cfg.maxDate;}else{const t=new Date();const f=new Date(t.getTime()-days*86400*1000);fromEl.value=f.toISOString().slice(0,10);toEl.value=t.toISOString().slice(0,10);}
      refresh();});
  });
  document.querySelectorAll('.sort-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.sort-chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentSort=btn.dataset.sort;refresh();});
  });
  $('#contrib-more').addEventListener('click',loadMore);

  // 초기 로드
  if(MODE==='embedded'){ALL_COMMITS=JSON.parse(document.getElementById('commit-data').textContent);}
  refresh();
}
