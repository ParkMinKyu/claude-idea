// git-stats 로컬 분석 서버. 의존성 0 (node:http만 사용).
// 흐름: 서버 실행 → 브라우저에서 ① 경로 입력 ② 폴더 목록 클릭 ③ 드래그앤드롭
//       → [분석] → 서버가 git 분석 → 같은 페이지에 리포트 표시.
//
// 보안: 기본적으로 127.0.0.1(localhost)에만 바인딩. 로컬 머신 밖으로 노출되지 않음.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadCommits, listBranches } from '../lib/core.mjs';
import { renderShell, buildReportPayload, STYLE, CLIENT_SCRIPT } from '../lib/render.mjs';

// ─────────── 분석 결과 캐시 ───────────
// repo+옵션을 키로 커밋 배열을 메모리에 보관 → 필터/정렬/드릴다운 시 git 재실행 없음.
// 최근 8개만 유지(대형 저장소 메모리 보호).
const cache = new Map();
const CACHE_MAX = 8;
function cacheKey(repo, opts) {
  return [repo, opts.branch || '', opts.all ? 1 : 0, opts.includeMerges ? 1 : 0].join('|');
}
function getCommits(repo, opts) {
  const key = cacheKey(repo, opts);
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit; } // LRU 갱신
  const commits = loadCommits(repo, opts);
  cache.set(key, commits);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return commits;
}
function filterByDate(commits, from, to) {
  if (!from && !to) return commits;
  return commits.filter((c) => {
    const d = c.date.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  });
}
function optsFromQuery(url) {
  return {
    branch: url.searchParams.get('branch') || undefined,
    all: url.searchParams.get('all') === '1',
    includeMerges: url.searchParams.get('includeMerges') === '1',
  };
}

const DEFAULT_PORT = 7373;
const DEFAULT_HOST = '127.0.0.1';

function openInBrowser(url) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function isGitRepo(dir) {
  try {
    return fs.existsSync(path.join(dir, '.git'));
  } catch {
    return false;
  }
}

// 한 폴더 아래의 하위 디렉터리 목록 (git 저장소 여부 포함). 폴더 브라우저용.
function listDirs(base) {
  const resolved = path.resolve(base);
  let entries;
  try {
    entries = fs.readdirSync(resolved, { withFileTypes: true });
  } catch (err) {
    throw new Error(`폴더를 읽을 수 없습니다: ${resolved} (${err.code})`);
  }
  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => {
      const full = path.join(resolved, e.name);
      return { name: e.name, path: full, isRepo: isGitRepo(full) };
    })
    .sort((a, b) => {
      if (a.isRepo !== b.isRepo) return a.isRepo ? -1 : 1; // 저장소 먼저
      return a.name.localeCompare(b.name);
    });
  return { base: resolved, parent: path.dirname(resolved), dirs };
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(body);
}
function sendHtml(res, status, html) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function handleApi(req, res, url) {
  // 폴더 목록: /api/dirs?base=/some/path  (base 생략 시 홈 디렉터리)
  if (url.pathname === '/api/dirs') {
    const base = url.searchParams.get('base') || os.homedir();
    try {
      sendJson(res, 200, listDirs(base));
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  // 브랜치 목록: /api/branches?repo=/path
  if (url.pathname === '/api/branches') {
    const repo = url.searchParams.get('repo');
    if (!repo) return (sendJson(res, 400, { error: 'repo 파라미터가 필요합니다.' }), true);
    const resolved = path.resolve(repo);
    if (!isGitRepo(resolved)) {
      return (sendJson(res, 400, { error: `'${resolved}' 에 .git 폴더가 없습니다.` }), true);
    }
    try {
      sendJson(res, 200, { repo: resolved, ...listBranches(resolved) });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  // 분석 시작: /api/analyze?repo=/path&branch=&all=&includeMerges=
  // → 커밋을 캐시에 적재하고, 서버 모드 리포트 골격 HTML + 메타(날짜범위)를 반환.
  //   (전체 커밋은 보내지 않음. 집계는 이후 /api/report가 담당.)
  if (url.pathname === '/api/analyze') {
    const repo = url.searchParams.get('repo');
    if (!repo) return (sendJson(res, 400, { error: 'repo 파라미터가 필요합니다.' }), true);
    const resolved = path.resolve(repo);
    if (!isGitRepo(resolved)) {
      return (sendJson(res, 400, { error: `'${resolved}' 에 .git 폴더가 없습니다.` }), true);
    }
    try {
      const opts = optsFromQuery(url);
      const commits = getCommits(resolved, opts);
      if (commits.length === 0) {
        return (sendJson(res, 200, { error: '이 저장소에는 분석할 커밋이 없습니다. (아직 커밋이 없거나, 선택한 브랜치/옵션에 해당하는 커밋이 없습니다)', repo: resolved }), true);
      }
      const dates = commits.map((c) => c.date.slice(0, 10)).sort();
      const shellHtml = renderShell(resolved, {
        mode: 'server',
        minDate: dates[0] || '',
        maxDate: dates[dates.length - 1] || '',
        totalCommits: commits.length,
      }).replace(
        // 서버 모드: report-config에 옵션을 함께 심어 클라가 API 호출 시 전달.
        /("mode":"server")/,
        `$1,"opts":${JSON.stringify({ branch: opts.branch || '', all: opts.all ? '1' : '', includeMerges: opts.includeMerges ? '1' : '' })}`,
      );
      sendJson(res, 200, { repo: resolved, count: commits.length, shellHtml });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  // 집계: /api/report?repo=&from=&to=&sort=&offset=&branch=&all=&includeMerges=
  // → 캐시된 커밋에 날짜 필터 적용 후 집계 HTML 조각만 반환 (커밋 원본 미포함).
  if (url.pathname === '/api/report') {
    const repo = url.searchParams.get('repo');
    if (!repo) return (sendJson(res, 400, { error: 'repo 파라미터가 필요합니다.' }), true);
    const resolved = path.resolve(repo);
    try {
      const all = getCommits(resolved, optsFromQuery(url));
      const filtered = filterByDate(all, url.searchParams.get('from'), url.searchParams.get('to'));
      const payload = buildReportPayload(filtered, {
        sort: url.searchParams.get('sort') || 'commits',
        contribOffset: parseInt(url.searchParams.get('offset') || '0', 10) || 0,
      });
      sendJson(res, 200, payload);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  // 드릴다운: /api/commits-at?repo=&day=&hour=&email=&from=&to=&...
  // → 캐시에서 해당 시간대(+선택 기여자) 커밋만 반환.
  if (url.pathname === '/api/commits-at') {
    const repo = url.searchParams.get('repo');
    if (!repo) return (sendJson(res, 400, { error: 'repo 파라미터가 필요합니다.' }), true);
    const resolved = path.resolve(repo);
    const day = parseInt(url.searchParams.get('day'), 10);
    const hour = parseInt(url.searchParams.get('hour'), 10);
    const email = (url.searchParams.get('email') || '').toLowerCase();
    try {
      const all = getCommits(resolved, optsFromQuery(url));
      const filtered = filterByDate(all, url.searchParams.get('from'), url.searchParams.get('to'));
      const KST = 9 * 60 * 60 * 1000;
      const matched = filtered.filter((c) => {
        if (email && (c.email || c.author || '').toLowerCase() !== email) return false;
        const k = new Date(new Date(c.date).getTime() + KST);
        return k.getUTCDay() === day && k.getUTCHours() === hour;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      // 한 시간대에 커밋이 매우 많은 대형 저장소 대비: DOM 폭발 방지로 최신 500개만.
      const LIMIT = 500;
      const items = matched.slice(0, LIMIT);
      sendJson(res, 200, { count: matched.length, shown: items.length, truncated: matched.length > LIMIT, commits: items });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  return false;
}

const PAGE = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>Git Stats · 로컬 분석 서버</title><meta name="viewport" content="width=device-width,initial-scale=1">
${STYLE}
<style>
.picker{max-width:880px;margin:0 auto;padding:48px 0}
.picker h1{font-size:30px;font-weight:700;margin:0 0 8px;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.picker .sub{color:var(--dim);font-size:14px;margin-bottom:32px}
.pick-card{background:var(--bg-2);border:1px solid var(--border);border-radius:16px;padding:28px;margin-bottom:20px}
.pick-card h3{margin:0 0 14px;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px}
.btn{background:var(--accent);color:#fff;border:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:0.15s;white-space:nowrap}
.btn:hover{background:#8b4ff0}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn.ghost{background:var(--bg-3);color:var(--dim);border:1px solid var(--border)}
.btn.ghost:hover{color:var(--text);border-color:var(--accent)}
.crumb{font-family:"SF Mono",Menlo,monospace;font-size:12px;color:var(--dim);margin-bottom:12px;word-break:break-all}
.crumb .up{color:var(--accent-2);cursor:pointer}
.dir-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;max-height:340px;overflow-y:auto}
.dir-item{display:flex;align-items:center;gap:8px;background:var(--bg-3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;cursor:pointer;font-size:13px;transition:0.12s;min-width:0}
.dir-item:hover{border-color:var(--accent);background:#202a3d}
.dir-item .ico{flex-shrink:0}
.dir-item .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
.dir-item.repo{border-color:#2d6a4f}
.dir-item.active{border-color:var(--accent);background:rgba(124,58,237,0.15);box-shadow:0 0 0 1px var(--accent)}
.dir-item .badge{font-size:10px;background:#22c55e;color:#062c14;padding:2px 6px;border-radius:5px;font-weight:700;flex-shrink:0}
.dir-item .go{font-size:10px;background:var(--accent);color:#fff;padding:2px 7px;border-radius:5px;font-weight:700;flex-shrink:0;opacity:0;transition:0.12s}
.dir-item.repo:hover .go{opacity:1}
.opts{display:flex;gap:18px;flex-wrap:wrap;align-items:center;font-size:13px;color:var(--dim)}
.opts label{display:flex;align-items:center;gap:6px;cursor:pointer}
.opts select{background:var(--bg-3);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:7px;font-size:12px;font-family:"SF Mono",Menlo,monospace;cursor:pointer;max-width:240px}
.opts select:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.opts select:disabled{opacity:0.4;cursor:not-allowed}
.opt-branch-wrap.disabled{opacity:0.5}
.opts-repo{font-weight:400;font-size:12px;color:var(--accent-2);font-family:"SF Mono",Menlo,monospace;margin-left:4px}
.opts-actions{display:flex;gap:10px;margin-top:18px}
.msg{padding:12px 16px;border-radius:10px;font-size:13px;margin-top:14px}
.msg.err{background:rgba(239,68,68,0.12);color:#fca5a5;border:1px solid rgba(239,68,68,0.3)}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:-3px;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
.report-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.report-head .btn{padding:8px 16px;font-size:13px}
#report{display:none}
</style></head><body>
<div class="container">
  <div id="picker" class="picker">
    <h1>📊 Git Stats · 로컬 분석 서버</h1>
    <div class="sub">분석할 git 저장소를 클릭하세요. <span style="color:var(--dim)">초록 <strong style="color:#22c55e">git</strong> 배지가 붙은 폴더가 분석 가능한 저장소입니다.</span> 데이터는 이 컴퓨터 밖으로 나가지 않습니다.</div>

    <div class="pick-card">
      <h3>📁 폴더 둘러보기</h3>
      <div class="crumb" id="crumb"></div>
      <div class="dir-list" id="dir-list"></div>
    </div>

    <div class="pick-card" id="opts-card" style="display:none">
      <h3>⚙️ 분석 옵션 <span class="opts-repo" id="opts-repo"></span></h3>
      <div class="opts">
        <label class="opt-branch-wrap">브랜치
          <select id="opt-branch">
            <option value="">(현재 HEAD)</option>
          </select>
        </label>
        <label><input type="checkbox" id="opt-all"> 모든 브랜치 합산</label>
        <label><input type="checkbox" id="opt-merges"> 머지 커밋 포함</label>
      </div>
      <div class="opts-actions">
        <button class="btn" id="run-btn">📊 분석</button>
        <button class="btn ghost" id="cancel-btn">취소</button>
      </div>
      <div id="msg"></div>
    </div>
  </div>

  <div id="report">
    <div class="report-head">
      <div></div>
      <button class="btn ghost" id="back-btn">← 다른 저장소 분석</button>
    </div>
    <div id="report-body"></div>
  </div>
</div>

<script>
const $ = (s) => document.querySelector(s);
const pickerEl = $('#picker');
const reportEl = $('#report');
const msgEl = $('#msg');

function showMsg(text, isErr) {
  msgEl.innerHTML = text ? '<div class="msg ' + (isErr ? 'err' : '') + '">' + text + '</div>' : '';
}

async function loadDirs(base) {
  const u = new URL('/api/dirs', location.origin);
  if (base) u.searchParams.set('base', base);
  const r = await fetch(u);
  const data = await r.json();
  if (data.error) { showMsg(data.error, true); return; }
  renderDirs(data);
}

function renderDirs(data) {
  $('#crumb').innerHTML = '<span class="up" id="go-up">⬆ 상위로</span>  ' + data.base;
  $('#go-up').onclick = () => loadDirs(data.parent);
  const list = $('#dir-list');
  if (!data.dirs.length) { list.innerHTML = '<div style="color:var(--dim-2);font-size:13px;padding:8px">하위 폴더 없음</div>'; return; }
  list.innerHTML = data.dirs.map((d) =>
    '<div class="dir-item' + (d.isRepo ? ' repo' : '') + '" data-path="' + d.path.replace(/"/g, '&quot;') + '" data-repo="' + d.isRepo + '">' +
      '<span class="ico">' + (d.isRepo ? '📦' : '📁') + '</span>' +
      '<span class="nm">' + d.name + '</span>' +
      (d.isRepo ? '<span class="badge">git</span><span class="go">분석 →</span>' : '') +
    '</div>'
  ).join('');
  list.querySelectorAll('.dir-item').forEach((el) => {
    el.onclick = () => {
      const p = el.dataset.path;
      if (el.dataset.repo === 'true') selectRepo(p, el);
      else loadDirs(p);
    };
  });
}

let selectedRepo = '';

// 1단계: 저장소 선택 → 브랜치 목록 로드 → 옵션 패널 표시.
async function selectRepo(repo, el) {
  selectedRepo = repo;
  // 선택 표시
  document.querySelectorAll('.dir-item.active').forEach((x) => x.classList.remove('active'));
  if (el) el.classList.add('active');

  const card = $('#opts-card');
  card.style.display = 'block';
  $('#opts-repo').textContent = repo;
  $('#opt-all').checked = false;
  $('#opt-merges').checked = false;
  showMsg('<span class="spinner"></span>브랜치 목록 불러오는 중…');

  const sel = $('#opt-branch');
  sel.innerHTML = '<option value="">불러오는 중…</option>';
  sel.disabled = true;

  const u = new URL('/api/branches', location.origin);
  u.searchParams.set('repo', repo);
  let data;
  try {
    const r = await fetch(u);
    data = await r.json();
  } catch (e) {
    showMsg('브랜치 목록 실패: ' + e.message, true); return;
  }
  if (data.error) { showMsg(data.error, true); return; }
  showMsg('');

  const cur = data.current || '';
  const opts = ['<option value="">현재 HEAD' + (cur ? ' (' + cur + ')' : '') + '</option>']
    .concat((data.branches || []).map((b) =>
      '<option value="' + b.replace(/"/g, '&quot;') + '">' + b + (b === cur ? ' ← 현재' : '') + '</option>'
    ));
  sel.innerHTML = opts.join('');
  sel.disabled = false;

  // 옵션 패널로 스크롤
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// "모든 브랜치 합산" 체크 시 단일 브랜치 선택은 의미 없으므로 비활성화.
function syncBranchEnabled() {
  const all = $('#opt-all').checked;
  const sel = $('#opt-branch');
  sel.disabled = all;
  $('.opt-branch-wrap').classList.toggle('disabled', all);
}

// 2단계: 옵션 확정 후 실제 분석.
async function analyze(repo) {
  if (!repo) { showMsg('저장소를 선택하세요.', true); return; }
  showMsg('<span class="spinner"></span>분석 중… ' + repo);
  const u = new URL('/api/analyze', location.origin);
  u.searchParams.set('repo', repo);
  const all = $('#opt-all').checked;
  if (all) u.searchParams.set('all', '1');
  if ($('#opt-merges').checked) u.searchParams.set('includeMerges', '1');
  const branch = $('#opt-branch').value.trim();
  if (branch && !all) u.searchParams.set('branch', branch);
  let data;
  try {
    const r = await fetch(u);
    data = await r.json();
  } catch (e) {
    showMsg('서버 요청 실패: ' + e.message, true); return;
  }
  if (data.error) { showMsg(data.error, true); return; }
  showMsg('');
  // 서버 모드 골격 주입(커밋 원본 없음). 골격에 #report-config가 포함돼 있어
  // 런타임이 그걸 읽고 /api/report·/api/commits-at로 집계를 가져온다.
  $('#report-body').innerHTML = data.shellHtml;
  pickerEl.style.display = 'none';
  reportEl.style.display = 'block';
  window.scrollTo(0, 0);
  runReport();
}

$('#run-btn').onclick = () => analyze(selectedRepo);
$('#cancel-btn').onclick = () => {
  $('#opts-card').style.display = 'none';
  document.querySelectorAll('.dir-item.active').forEach((x) => x.classList.remove('active'));
  selectedRepo = '';
};
$('#opt-all').addEventListener('change', syncBranchEnabled);
$('#back-btn').onclick = () => {
  reportEl.style.display = 'none';
  pickerEl.style.display = 'block';
  $('#opts-card').style.display = 'none';
  document.querySelectorAll('.dir-item.active').forEach((x) => x.classList.remove('active'));
};

// 리포트 본문이 주입된 뒤 실행할 런타임 (서버 렌더와 동일 로직).
function runReport() {
  ${reportRuntimeSource()}
  clientRuntime();
}

loadDirs();
</script>
</body></html>`;

// CLIENT_SCRIPT에서 <script> 태그와 호출부를 제거하고 함수 본문만 추출 → SPA에 인라인.
function reportRuntimeSource() {
  return CLIENT_SCRIPT
    .replace(/^<script>\s*/, '')
    .replace(/\s*clientRuntime\(\);\s*<\/script>\s*$/, '');
}

export function startServer({ port = DEFAULT_PORT, host = DEFAULT_HOST, open = true } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      if (handleApi(req, res, url)) return;
      return sendJson(res, 404, { error: 'unknown api' });
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return sendHtml(res, 200, PAGE);
    }
    sendHtml(res, 404, '<h1>404</h1>');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ 포트 ${port}가 이미 사용 중입니다. --port=<다른포트> 로 다시 시도하세요.`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, host, () => {
    const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    console.error(`\n  📊 git-stats 로컬 서버 실행 중`);
    console.error(`  → ${url}`);
    console.error(`  (Ctrl+C 로 종료)\n`);
    if (open) openInBrowser(url);
  });
  return server;
}
