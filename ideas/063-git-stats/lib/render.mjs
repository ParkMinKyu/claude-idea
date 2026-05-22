// git-stats HTML 렌더러.
//
// 두 가지 사용처:
//  1) CLI 단일 파일 모드 — renderHtml(): 전체 커밋을 페이지에 임베드, 클라가 재집계.
//     (작은~중형 저장소용. 오프라인 파일 하나로 완결.)
//  2) 서버 모드 — renderShell() + render*Html() 조각들: 서버가 집계해 HTML 조각을
//     /api/report 응답에 담아 보내고, 클라는 주입만. 카드는 Top N만 그려 대형 저장소도 빠름.
import {
  byContributor, hotspots, busFactor, heatmap,
  activityByMonth, contributorSpans, fileOwnership, staleFiles,
  coupling, sizeDistribution, messageConvention, languageDistribution,
} from './core.mjs';
import {
  KST_OFFSET_MS, DAY_LABELS, CONTRIB_PAGE,
  esc, splitPath, fmt, timeAgo, fmtDate, initials, avatarColor, kstParts, sortContribs,
} from './format.mjs';
import { STYLE } from './style.mjs';
import { CLIENT_SCRIPT } from './client-runtime.mjs';

// 기존 import 경로 보존: serve.mjs·git-stats.mjs는 render.mjs에서 STYLE/CLIENT_SCRIPT를 가져온다.
export { STYLE } from './style.mjs';
export { CLIENT_SCRIPT } from './client-runtime.mjs';
export { CONTRIB_PAGE } from './format.mjs';

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
    const yy = String(d.getUTCFullYear()).slice(2);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return `<div class="commit-item"><span class="commit-hash">${esc(c.hash.slice(0, 7))}</span><div class="commit-main"><div class="commit-subject">${esc(c.subject || '(no message)')}</div><div class="commit-author">${esc(c.author || '')} &lt;${esc(c.email || '')}&gt;</div></div><div class="commit-time">${yy}-${mm}-${dd} ${hh}:${mi}</div></div>`;
  }).join('');
  return `<div class="heat-detail"><div class="heat-detail-head"><div class="heat-detail-title">${DAY_LABELS[day]}요일 <strong>${String(hour).padStart(2, '0')}:00 ~ ${String(hour).padStart(2, '0')}:59</strong> · ${items.length}개 커밋</div><button class="heat-detail-close" aria-label="닫기">×</button></div><div class="heat-detail-body">${rows}</div></div>`;
}

/** 커밋 목록 행 (커밋 상세 탭). 이미 정렬·슬라이스된 배열을 받음. */
export function renderCommitRowsHtml(items) {
  return items.map((c) => {
    const d = new Date(new Date(c.date).getTime() + KST_OFFSET_MS);
    const ts = `${String(d.getUTCFullYear()).slice(2)}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    return `<div class="commit-row"><span class="commit-hash">${esc(c.hash.slice(0, 7))}</span><div class="c-main"><div class="c-subject">${esc(c.subject || '(no message)')}</div><div class="c-author">${esc(c.author || '')} &lt;${esc(c.email || '')}&gt;</div></div><div class="c-lines"><span class="add">+${fmt(c.additions ?? 0)}</span><span class="del">−${fmt(c.deletions ?? 0)}</span></div><div class="c-time">${ts}</div></div>`;
  }).join('');
}

// ── 추가 지표 HTML 조각 ──

/** 월별 활동 막대 그래프. */
export function renderActivityHtml(months) {
  if (!months.length) return '<div class="empty">데이터 없음</div>';
  const max = Math.max(1, ...months.map((m) => m.commits));
  const bars = months.map((m) => {
    const h = (m.commits / max) * 100;
    return `<div class="act-col" title="${m.month} · ${m.commits} commits (+${fmt(m.additions)}/-${fmt(m.deletions)})"><div class="act-bar" style="height:${h}%"></div><div class="act-x">${m.month.slice(2)}</div></div>`;
  }).join('');
  return `<div class="act-chart">${bars}</div>`;
}

/** 기여자 합류/이탈 타임라인 (간트). spans는 first 순. 행이 많으면 활동량 상위만. */
export function renderTimelineHtml(spans, limit = 100) {
  if (!spans.length) return '<div class="empty">데이터 없음</div>';
  let note = '';
  if (spans.length > limit) {
    // 커밋 많은 상위 limit명만, 다시 first 순으로.
    const top = [...spans].sort((a, b) => b.commits - a.commits).slice(0, limit)
      .sort((a, b) => a.first.localeCompare(b.first));
    note = `<div class="dim" style="font-size:11px;margin-bottom:10px">전체 ${spans.length}명 중 커밋 상위 ${limit}명 표시</div>`;
    spans = top;
  }
  const min = new Date(spans.reduce((a, s) => (s.first < a ? s.first : a), spans[0].first)).getTime();
  const max = Math.max(...spans.map((s) => new Date(s.last).getTime()));
  const range = Math.max(1, max - min);
  const rows = spans.map((s) => {
    const l = ((new Date(s.first).getTime() - min) / range) * 100;
    const w = Math.max(1, ((new Date(s.last).getTime() - new Date(s.first).getTime()) / range) * 100);
    return `<div class="tl-row" title="${esc(s.author)} · ${fmtDate(s.first)} ~ ${fmtDate(s.last)} · ${s.commits} commits"><div class="tl-name">${esc(s.author || '(이름 없음)')}</div><div class="tl-track"><div class="tl-bar" style="left:${l}%;width:${w}%;background:${avatarColor(s.email || s.author || '')}"></div></div></div>`;
  }).join('');
  return `${note}<div class="tl">${rows}</div>`;
}

/** 버스팩터 파일 지도: 단독 소유 위험 파일. */
export function renderOwnershipHtml(rows) {
  if (!rows.length) return '<div class="empty">데이터 없음</div>';
  return rows.map((r, i) => {
    const { dir, name } = splitPath(r.file);
    const solo = r.authors === 1;
    const dead = r.alive === false;
    return `<div class="row">
      <span class="rank">${i + 1}</span>
      <div class="row-main">
        <div class="row-title path">${dir ? `<span class="path-dir">${esc(dir)}</span>` : ''}<span class="path-name">${esc(name)}</span> ${dead ? '<span class="tag dead">삭제됨</span>' : ''}</div>
        <div class="own-meta">${solo ? '<span class="tag risk">⚠ 단독 소유</span>' : `${r.authors}명`} · 최다 ${Math.round(r.topShare * 100)}% · ${r.touches}회 변경</div>
      </div>
      <div class="row-value">${r.authors}<span class="row-unit">명</span></div>
    </div>`;
  }).join('');
}

/** 고아(오래 안 바뀐 현존) 파일. */
export function renderStaleHtml(rows) {
  if (!rows.length) return '<div class="empty">현존 파일 정보 없음 (git ls-files 실패 시)</div>';
  return rows.map((r, i) => {
    const { dir, name } = splitPath(r.file);
    return `<div class="row">
      <span class="rank">${i + 1}</span>
      <div class="row-main"><div class="row-title path">${dir ? `<span class="path-dir">${esc(dir)}</span>` : ''}<span class="path-name">${esc(name)}</span></div></div>
      <div class="row-value" style="font-size:14px" title="${fmtDate(r.lastTouched)}">${timeAgo(r.lastTouched)}</div>
    </div>`;
  }).join('');
}

/** 변경 결합도: 강도(%) 막대 + 동시변경/핫스팟 메타. 막대 = 결합 강도. */
export function renderCouplingHtml(pairs) {
  if (!pairs.length) return '<div class="empty">조건을 만족하는 결합 파일 쌍 없음</div>';
  return pairs.map((p, i) => {
    const a = splitPath(p.a); const b = splitPath(p.b);
    const pct = Math.round(p.strength * 100);
    const strong = p.strength >= 0.8;
    return `<div class="row">
      <span class="rank">${i + 1}</span>
      <div class="row-main">
        <div class="row-title path"><span class="path-dir">${esc(a.dir)}</span><span class="path-name">${esc(a.name)}</span> <span class="couple-amp">↔</span> <span class="path-dir">${esc(b.dir)}</span><span class="path-name">${esc(b.name)}</span></div>
        <div class="row-bar"><div class="row-fill${strong ? ' strong' : ''}" style="width:${pct}%"></div></div>
        <div class="own-meta">함께 ${p.together}회 · 각 변경 ${p.aHot}/${p.bHot}회${strong ? ' · <span class="tag risk">강결합</span>' : ''}</div>
      </div>
      <div class="row-value">${pct}<span class="row-unit">%</span></div>
    </div>`;
  }).join('');
}

/** 결합도 탭: 폴더 트리 (재귀). fileTree() 결과의 root.children을 받음. */
export function renderTreeNodes(children, depth = 0) {
  return children.map((n) => {
    if (n.children) {
      return `<div class="ftree-folder" data-path="${esc(n.path)}"><div class="ftree-row folder" style="padding-left:${depth * 14 + 8}px"><span class="ftree-caret">▸</span><span class="ftree-ico">📁</span><span class="ftree-name">${esc(n.name)}</span></div><div class="ftree-children">${renderTreeNodes(n.children, depth + 1)}</div></div>`;
    }
    return `<div class="ftree-file" data-file="${esc(n.file)}" style="padding-left:${depth * 14 + 8}px"><span class="ftree-ico">📄</span><span class="ftree-name">${esc(n.name)}</span><span class="ftree-hot">${n.hot}</span></div>`;
  }).join('');
}

/** 결합도 탭: 트리 컨테이너 HTML. */
export function renderCouplingTreeHtml(tree) {
  if (!tree || !tree.root.children.length) return '<div class="empty">결합 데이터가 있는 파일이 없습니다.</div>';
  const note = tree.truncated ? `<div class="dim" style="font-size:11px;padding:4px 8px">전체 ${tree.total}개 중 변경 많은 ${tree.maxFiles}개 표시</div>` : '';
  return note + renderTreeNodes(tree.root.children);
}

/** 결합도 탭: 선택 파일의 연관 파일 목록. couplingForFile() 결과를 받음. */
export function renderPartnersHtml(result) {
  if (!result || !result.partners.length) {
    return `<div class="partners-head">📄 <strong>${esc(result ? splitPath(result.file).name : '')}</strong></div><div class="empty">함께 바뀐 파일이 없습니다.</div>`;
  }
  const sp = splitPath(result.file);
  const rows = result.partners.map((p, i) => {
    const { dir, name } = splitPath(p.file);
    const pct = Math.round(p.strength * 100);
    const strong = p.strength >= 0.8;
    return `<div class="row" data-file="${esc(p.file)}">
      <span class="rank">${i + 1}</span>
      <div class="row-main">
        <div class="row-title path">${dir ? `<span class="path-dir">${esc(dir)}</span>` : ''}<span class="path-name">${esc(name)}</span></div>
        <div class="row-bar"><div class="row-fill${strong ? ' strong' : ''}" style="width:${pct}%"></div></div>
        <div class="own-meta">함께 ${p.together}회 · 이 파일 총 ${p.hot}회 변경${strong ? ' · <span class="tag risk">강결합</span>' : ''}</div>
      </div>
      <div class="row-value">${pct}<span class="row-unit">%</span></div>
    </div>`;
  }).join('');
  return `<div class="partners-head"><span class="path-dir">${esc(sp.dir)}</span><strong>${esc(sp.name)}</strong> <span class="dim">· 총 ${result.totalChanges}회 변경 · 연관 ${result.partners.length}개</span></div>${rows}`;
}

/** 커밋 크기 분포 막대. */
export function renderSizeHtml(buckets) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return buckets.map((b) => {
    const w = (b.count / max) * 100;
    return `<div class="dist-row"><div class="dist-label">${b.label} 라인</div><div class="dist-track"><div class="dist-fill" style="width:${w}%"></div></div><div class="dist-val">${fmt(b.count)}</div></div>`;
  }).join('');
}

/** 메시지 컨벤션 준수율 + 타입 분포. */
export function renderConventionHtml(conv) {
  const pct = Math.round(conv.rate * 100);
  const typeChips = conv.types.map((t) => `<span class="conv-chip"><b>${t.type}</b> ${t.count}</span>`).join('') || '<span class="dim">conventional commit 형식 커밋 없음</span>';
  return `<div class="conv-rate"><div class="conv-ring" style="--pct:${pct}"><span>${pct}%</span></div><div class="conv-desc"><div class="conv-big">${fmt(conv.conforming)} / ${fmt(conv.total)}</div><div class="dim">feat:/fix: 등 컨벤션 준수 커밋</div></div></div><div class="conv-types">${typeChips}</div>`;
}

/** 언어(확장자) 분포 막대. */
export function renderLanguageHtml(lang) {
  if (!lang.top.length) return '<div class="empty">데이터 없음</div>';
  const max = Math.max(...lang.top.map((x) => x.count));
  return lang.top.map((x) => {
    const w = (x.count / max) * 100;
    return `<div class="dist-row"><div class="dist-label">.${esc(x.ext)}</div><div class="dist-track"><div class="dist-fill" style="width:${w}%"></div></div><div class="dist-val">${Math.round(x.share * 100)}%</div></div>`;
  }).join('');
}

/**
 * 결합 네트워크 그래프 데이터. 상위 결합 쌍에서 노드(파일)·엣지(결합)를 추출.
 * 노드 size=변경빈도(핫스팟), 엣지 strength=결합강도. 클라가 force 레이아웃으로 그림.
 * 노드 폭증 방지: 결합 쌍 상위 maxEdges개만 → 거기 등장한 파일만 노드.
 */
export function couplingGraphData(commits, { maxEdges = 45, minStrength = 0.3, minTogether = 3 } = {}) {
  const pairs = coupling(commits, { top: maxEdges, minStrength, minTogether });
  const nodeMap = new Map(); // file -> { id, hot }
  const nodes = [];
  const idOf = (f, hot) => {
    let n = nodeMap.get(f);
    if (!n) { n = { id: nodes.length, file: f, hot }; nodeMap.set(f, n); nodes.push(n); }
    return n.id;
  };
  const edges = pairs.map((p) => ({
    s: idOf(p.a, p.aHot), t: idOf(p.b, p.bHot), strength: p.strength, together: p.together,
  }));
  return { nodes: nodes.map((n) => ({ file: n.file, hot: n.hot })), edges };
}

/**
 * 서버 집계 진입점: 커밋 배열 → /api/report 응답 페이로드.
 * sort/contribOffset에 따라 카드 조각을 만들어 보낸다. 커밋 원본은 포함하지 않음.
 * trackedSet(현존 파일)이 있으면 고아/소유 alive 표시.
 */
export function buildReportPayload(commits, { sort = 'commits', contribOffset = 0, trackedSet = null } = {}) {
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
    activityHtml: renderActivityHtml(activityByMonth(commits)),
    timelineHtml: renderTimelineHtml(contributorSpans(commits)),
    ownershipHtml: renderOwnershipHtml(fileOwnership(commits, 20, trackedSet)),
    staleHtml: renderStaleHtml(staleFiles(commits, trackedSet, 20)),
    couplingHtml: renderCouplingHtml(coupling(commits, { top: 20 })),
    // 네트워크 그래프용 데이터(노드/엣지). 클라가 force 레이아웃으로 그림.
    couplingGraph: couplingGraphData(commits),
    sizeHtml: renderSizeHtml(sizeDistribution(commits)),
    conventionHtml: renderConventionHtml(messageConvention(commits)),
    languageHtml: renderLanguageHtml(languageDistribution(commits, 12)),
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

<nav class="tabs">
  <button class="tab-btn active" data-tab="summary">📊 요약</button>
  <button class="tab-btn" data-tab="commits">⏱ 커밋 상세</button>
  <button class="tab-btn" data-tab="contributors">👥 기여자 상세</button>
  <button class="tab-btn" data-tab="files">📁 파일 상세</button>
  <button class="tab-btn" data-tab="coupling">🔗 결합도 탐색</button>
</nav>

<!-- ── 요약 탭 ── -->
<div class="tab-panel active" data-tab="summary">
<div id="stats-grid" class="stats-grid"></div>

<div class="dual-grid">
  <section>
    <h2>📦 커밋 크기 분포</h2>
    <div class="h2-hint">커밋당 변경 라인 수. 거대 커밋이 많으면 리뷰가 어렵습니다.</div>
    <div class="section-card" style="padding:20px"><div id="size"></div></div>
  </section>
  <section>
    <h2>💬 메시지 컨벤션</h2>
    <div class="h2-hint">feat:/fix: 등 conventional commit 준수율.</div>
    <div class="section-card" style="padding:20px"><div id="convention"></div></div>
  </section>
</div>

<section>
  <h2>🗂 언어 / 확장자 분포</h2>
  <div class="h2-hint">변경된 파일 확장자 비율 — 기술 스택 구성.</div>
  <div class="section-card" style="padding:20px"><div id="language"></div></div>
</section>
</div><!-- /요약 탭 -->

<!-- ── 커밋 상세 탭 ── -->
<div class="tab-panel" data-tab="commits">
<section>
  <h2>📜 커밋 목록</h2>
  <div class="h2-hint">최신순. 메시지·작성자·해시로 검색. <span id="commit-total" style="color:var(--dim-2)"></span></div>
  <div class="commit-search-bar"><input type="text" id="commit-search" placeholder="🔍 메시지·작성자·해시 검색" spellcheck="false" autocomplete="off"></div>
  <div id="commit-list" class="section-card"></div>
  <div id="commit-more-wrap" style="text-align:center;margin-top:12px;display:none"><button class="btn ghost" id="commit-more">더 보기</button></div>
</section>

<section>
  <h2>📈 커밋 활동 추이</h2>
  <div class="h2-hint">월별 커밋 수. 프로젝트가 활발한지·식어가는지 한눈에.</div>
  <div class="section-card" style="padding:24px"><div id="activity"></div></div>
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
</div><!-- /커밋 탭 -->

<!-- ── 기여자 상세 탭 ── -->
<div class="tab-panel" data-tab="contributors">
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
  <h2>📅 기여자 타임라인 — 합류 / 이탈</h2>
  <div class="h2-hint">각 기여자의 첫 커밋 ~ 마지막 커밋 구간. 팀이 어떻게 변해왔나.</div>
  <div class="section-card" style="padding:24px"><div id="timeline"></div></div>
</section>
</div><!-- /기여자 탭 -->

<!-- ── 파일 상세 탭 ── -->
<div class="tab-panel" data-tab="files">
<section>
  <h2>🔥 핫스팟 — 가장 자주 수정된 파일</h2>
  <div class="h2-hint">변경 빈도가 높은 파일은 리팩토링 후보이자 버그 위험 지대입니다.</div>
  <div id="hotspots" class="section-card"></div>
  <div class="more-wrap" data-list="hotspots" style="text-align:center;margin-top:12px;display:none"><button class="btn ghost list-more">더 보기</button></div>
</section>

<section>
  <h2>🚌 버스 팩터 — 파일 소유 위험</h2>
  <div class="h2-hint">단 한 명만 만진 파일은 그 사람이 떠나면 위험합니다. (현존 파일 기준 우선)</div>
  <div id="ownership" class="section-card"></div>
  <div class="more-wrap" data-list="ownership" style="text-align:center;margin-top:12px;display:none"><button class="btn ghost list-more">더 보기</button></div>
</section>

<section>
  <h2>🔗 변경 결합도 — 함께 바뀌는 파일</h2>
  <div class="h2-hint">"A가 바뀌면 B도 바뀔 확률(강도%)" 기준. 막대=강도, 메타=동시변경/각 변경 횟수. 강결합(80%+)은 숨은 의존성·잘못된 모듈 경계 신호. 점수 = 강도 × 변경규모 × 핫스팟.</div>
  <div class="section-card" style="padding:16px;margin-bottom:16px">
    <div class="graph-toolbar"><span class="dim" style="font-size:12px">파일=노드(클수록 자주 변경) · 선=결합(굵을수록 강함) · 드래그로 이동</span></div>
    <div id="coupling-graph" class="graph-wrap"></div>
  </div>
  <div id="coupling" class="section-card"></div>
  <div class="more-wrap" data-list="coupling" style="text-align:center;margin-top:12px;display:none"><button class="btn ghost list-more">더 보기</button></div>
</section>

<section>
  <h2>🍂 고아 파일 — 오래 방치된 코드</h2>
  <div class="h2-hint">현존하지만 오랫동안 아무도 손대지 않은 파일. 죽은 코드·문서 후보. (git ls-files 기준)</div>
  <div id="stale" class="section-card"></div>
  <div class="more-wrap" data-list="stale" style="text-align:center;margin-top:12px;display:none"><button class="btn ghost list-more">더 보기</button></div>
</section>
</div><!-- /파일 탭 -->

<!-- ── 결합도 탐색 탭 ── -->
<div class="tab-panel" data-tab="coupling">
<section>
  <h2>🔗 결합도 탐색</h2>
  <div class="h2-hint">왼쪽 트리에서 파일을 고르면, 그 파일과 함께 바뀐(결합된) 파일들을 강도순으로 보여줍니다.</div>
  <div class="cpl-search-bar"><input type="text" id="cpl-search" placeholder="🔍 파일명 검색" spellcheck="false" autocomplete="off"></div>
  <div class="cpl-layout">
    <div class="section-card cpl-tree-card"><div id="cpl-tree" class="ftree"><div class="loading"><span class="spin"></span>트리 불러오는 중…</div></div></div>
    <div class="section-card cpl-partners-card"><div id="cpl-partners"><div class="empty">← 왼쪽에서 파일을 선택하세요</div></div></div>
  </div>
</section>
</div><!-- /결합도 탭 -->

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

