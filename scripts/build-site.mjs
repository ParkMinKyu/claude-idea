#!/usr/bin/env node
// Build static GitHub Pages site from ideas/*/README.md
// Output: dist/index.html, dist/ideas/NNN-slug/index.html, dist/data.json, dist/assets/*
//
// Zero deps: bundled minimal markdown renderer.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { buildDemos } from "./build-demos.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Resolve the branch to link to on GitHub (so "소스 보기" never 404s).
const REPO = "ParkMinKyu/claude-idea";
let BRANCH = process.env.GITHUB_REF_NAME || "";
if (!BRANCH || BRANCH === "HEAD") {
  try {
    const b = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (b && b !== "HEAD") BRANCH = b;
  } catch { /* ignore */ }
}
if (!BRANCH) BRANCH = "main";
const IDEAS_DIR = path.join(ROOT, "ideas");
const SRC_DIR = path.join(ROOT, "site-src");
const OUT_DIR = path.join(ROOT, "dist");

const CATEGORIES = {
  AI:  { ranges: [[1, 15]],            label: "AI / LLM SaaS",   color: "#a855f7" },
  WEB: { ranges: [[16, 30]],           label: "웹 SaaS",          color: "#3b82f6" },
  AND: { ranges: [[31, 45]],           label: "안드로이드 앱",    color: "#22c55e" },
  EXT: { ranges: [[46, 55]],           label: "확장 / 데스크톱",  color: "#f59e0b" },
  DEV: { ranges: [[56, 65], [101, 140]], label: "개발자 도구",    color: "#ef4444" },
  CON: { ranges: [[66, 75]],           label: "콘텐츠 / 미디어",  color: "#ec4899" },
  COM: { ranges: [[76, 85]],           label: "이커머스 / 마켓",  color: "#06b6d4" },
  PRO: { ranges: [[86, 95]],           label: "생산성",           color: "#8b5cf6" },
  NIC: { ranges: [[96, 100]],          label: "니치 / 버티컬",    color: "#64748b" },
};

function categoryFor(num) {
  for (const [code, meta] of Object.entries(CATEGORIES)) {
    for (const [lo, hi] of meta.ranges) {
      if (num >= lo && num <= hi) return { code, ...meta };
    }
  }
  return { code: "OTH", label: "기타", color: "#6b7280" };
}

// --- Minimal Markdown → HTML (handles 90%+ of our usage) ---
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderInline(text) {
  // code spans first to protect contents
  text = text.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  // bold
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return text;
}
function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false, codeLang = "", codeBuf = [];
  let listStack = []; // stack of {type, indent}
  let para = [];
  let tableBuf = null; // {header, align, rows}

  function flushPara() {
    if (para.length) {
      out.push(`<p>${renderInline(para.join(" "))}</p>`);
      para = [];
    }
  }
  function closeLists(toIndent = -1) {
    while (listStack.length && listStack[listStack.length - 1].indent > toIndent) {
      const top = listStack.pop();
      out.push(top.type === "ul" ? "</ul>" : "</ol>");
    }
  }
  function flushTable() {
    if (!tableBuf) return;
    const { header, rows } = tableBuf;
    out.push("<div class='table-wrap'><table>");
    out.push("<thead><tr>" + header.map(h => `<th>${renderInline(h.trim())}</th>`).join("") + "</tr></thead>");
    out.push("<tbody>" + rows.map(r =>
      "<tr>" + r.map(c => `<td>${renderInline(c.trim())}</td>`).join("") + "</tr>"
    ).join("") + "</tbody>");
    out.push("</table></div>");
    tableBuf = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      if (inCode) {
        out.push(`<pre><code class="lang-${codeLang}">${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        inCode = false; codeBuf = []; codeLang = "";
      } else {
        flushPara(); closeLists(); flushTable();
        inCode = true; codeLang = fence[1] || "";
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Table detection: header | separator | rows
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])) {
      flushPara(); closeLists();
      const header = line.trim().slice(1, -1).split("|");
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].trim().slice(1, -1).split("|"));
        i++;
      }
      i--;
      tableBuf = { header, rows };
      flushTable();
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushPara(); closeLists(); flushTable();
      const lvl = h[1].length;
      const text = renderInline(h[2].trim());
      const id = h[2].trim().toLowerCase().replace(/[^\w가-힣\s-]/g, "").replace(/\s+/g, "-");
      out.push(`<h${lvl} id="${id}">${text}</h${lvl}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushPara(); closeLists(); flushTable();
      out.push("<hr>");
      continue;
    }

    // List item
    const ul = line.match(/^(\s*)[-*]\s+(.+)$/);
    const ol = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushPara(); flushTable();
      const m = ul || ol;
      const indent = m[1].length;
      const type = ul ? "ul" : "ol";
      closeLists(indent);
      if (!listStack.length || listStack[listStack.length - 1].indent < indent) {
        out.push(type === "ul" ? "<ul>" : "<ol>");
        listStack.push({ type, indent });
      }
      out.push(`<li>${renderInline(m[2])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      flushPara(); closeLists(); flushTable();
      continue;
    }

    // Paragraph accumulation
    closeLists();
    para.push(line.trim());
  }
  flushPara(); closeLists(); flushTable();
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  return out.join("\n");
}

// --- Parse one idea folder ---
function parseIdea(slug) {
  const dir = path.join(IDEAS_DIR, slug);
  const num = parseInt(slug.slice(0, 3), 10);
  const cat = categoryFor(num);

  const readmePath = path.join(dir, "README.md");
  const stackPath = path.join(dir, "TECH_STACK.md");
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
  const stack = fs.existsSync(stackPath) ? fs.readFileSync(stackPath, "utf8") : "";

  // Title: first H1
  const titleMatch = readme.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Tagline: first non-heading paragraph
  let tagline = "";
  const body = readme.replace(/^#.*$/m, "").split("\n");
  for (const line of body) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#") || t.startsWith(">") || t.startsWith("|") || t.startsWith("-")) continue;
    tagline = t.replace(/[*_`]/g, "").slice(0, 140);
    break;
  }

  // Count files in src/ and tests/
  let srcCount = 0, testCount = 0;
  const countFiles = (d) => {
    if (!fs.existsSync(d)) return 0;
    let c = 0;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) c += countFiles(path.join(d, e.name));
      else c += 1;
    }
    return c;
  };
  srcCount = countFiles(path.join(dir, "src"));
  testCount = countFiles(path.join(dir, "tests"));

  return { slug, num, cat, title, tagline, readme, stack, srcCount, testCount };
}

// --- Templates ---
function layout({ title, description, body, base, isHome }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="stylesheet" href="${base}assets/style.css">
${isHome ? `<script defer src="${base}assets/app.js"></script>` : ""}
</head>
<body class="${isHome ? "is-home" : "is-detail"}">
<header class="site-header">
  <div class="container">
    <a class="brand" href="${base}index.html">💡 100 Monetization Ideas</a>
    <nav>
      <a href="https://github.com/ParkMinKyu/claude-idea" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</header>
<main class="container">${body}</main>
<footer class="site-footer"><div class="container">100개 수익화 아이디어 + MVP 스캐폴드 · Built with Claude Code</div></footer>
</body></html>`;
}

function homeBody(ideas) {
  const catChips = Object.entries(CATEGORIES).map(([code, meta]) => {
    const count = ideas.filter(i => i.cat.code === code).length;
    return `<button class="chip" data-cat="${code}" style="--c:${meta.color}">${meta.label} <span class="chip-count">${count}</span></button>`;
  }).join("");

  const cards = ideas.map(i => `
    <a class="card" href="ideas/${i.slug}/index.html" data-cat="${i.cat.code}" data-slug="${i.slug}" data-title="${escapeHtml(i.title.toLowerCase())}" data-tagline="${escapeHtml((i.tagline || "").toLowerCase())}">
      <div class="card-head">
        <span class="num">#${String(i.num).padStart(3, "0")}</span>
        <span class="badge" style="--c:${i.cat.color}">${i.cat.label}</span>
      </div>
      <h3 class="card-title">${escapeHtml(i.title)}</h3>
      <p class="card-tagline">${escapeHtml(i.tagline || "")}</p>
      <div class="card-meta">
        <span>📦 ${i.srcCount} src</span>
        <span>✅ ${i.testCount} tests</span>
      </div>
    </a>`).join("");

  return `
<section class="hero">
  <h1>수익화 가능한 아이디어 100개</h1>
  <p class="sub">각 아이디어마다 상세 문서 · 기술 스택 · 실제 동작하는 MVP 코드 · 테스트 포함.</p>
  <div class="stats">
    <div><strong>${ideas.length}</strong><span>아이디어</span></div>
    <div><strong>${Object.keys(CATEGORIES).length}</strong><span>카테고리</span></div>
    <div><strong>${ideas.reduce((s,i) => s+i.srcCount, 0)}</strong><span>소스 파일</span></div>
    <div><strong>${ideas.reduce((s,i) => s+i.testCount, 0)}</strong><span>테스트 파일</span></div>
  </div>
</section>
<section class="filters">
  <input id="search" type="search" placeholder="검색: 아이디어, 한 줄 설명…" autocomplete="off">
  <div class="chips">
    <button class="chip is-active" data-cat="ALL">전체 <span class="chip-count">${ideas.length}</span></button>
    ${catChips}
  </div>
</section>
<section class="grid" id="grid">${cards}</section>
<p id="empty" class="empty" hidden>검색 결과 없음</p>`;
}

function detailBody(idea, prev, next, hasDemo) {
  const readmeHtml = renderMarkdown(idea.readme.replace(/^#\s+.+$/m, ""));
  const stackHtml = idea.stack ? renderMarkdown(idea.stack.replace(/^#\s+.+$/m, "")) : "<p>—</p>";
  const demoScripts = hasDemo
    ? `<script src="../../demos/${idea.slug}.js"></script>\n<script src="../../assets/demo-runner.js"></script>`
    : "";
  return `
<nav class="breadcrumb"><a href="../../index.html">← 전체 목록</a></nav>
<article class="detail">
  <header class="detail-head">
    <div class="detail-meta">
      <span class="num">#${String(idea.num).padStart(3, "0")}</span>
      <span class="badge" style="--c:${idea.cat.color}">${idea.cat.label}</span>
      ${hasDemo ? `<span class="badge" style="--c:#16a34a">▶ 데모 가능</span>` : ""}
    </div>
    <h1>${escapeHtml(idea.title)}</h1>
    <p class="lede">${escapeHtml(idea.tagline || "")}</p>
    <div class="actions">
      <a class="btn" href="https://github.com/${REPO}/tree/${BRANCH}/ideas/${idea.slug}" target="_blank" rel="noopener">소스 보기 (GitHub)</a>
      <span class="counts">📦 ${idea.srcCount} src · ✅ ${idea.testCount} tests</span>
    </div>
  </header>
  <div class="tabs">
    ${hasDemo ? `<button class="tab is-active" data-tab="demo">▶ 라이브 데모</button>` : ""}
    <button class="tab${hasDemo ? "" : " is-active"}" data-tab="readme">상세 문서</button>
    <button class="tab" data-tab="stack">기술 스택</button>
  </div>
  ${hasDemo ? `<section class="tab-panel is-active demo-section" data-panel="demo"><div id="demo-root"><p class="demo-empty">데모 로딩 중…</p></div></section>` : ""}
  <section class="tab-panel${hasDemo ? "" : " is-active"}" data-panel="readme">${readmeHtml}</section>
  <section class="tab-panel" data-panel="stack">${stackHtml}</section>
</article>
<nav class="pager">
  ${prev ? `<a class="pager-prev" href="../${prev.slug}/index.html">← #${String(prev.num).padStart(3,"0")} ${escapeHtml(prev.title)}</a>` : "<span></span>"}
  ${next ? `<a class="pager-next" href="../${next.slug}/index.html">#${String(next.num).padStart(3,"0")} ${escapeHtml(next.title)} →</a>` : "<span></span>"}
</nav>
<script>
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("is-active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("is-active"));
    t.classList.add("is-active");
    document.querySelector('[data-panel="' + t.dataset.tab + '"]').classList.add("is-active");
  };
});
</script>
${demoScripts}`;
}

// --- Main ---
async function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "ideas"), { recursive: true });

  // Copy assets
  for (const f of fs.readdirSync(SRC_DIR)) {
    fs.copyFileSync(path.join(SRC_DIR, f), path.join(OUT_DIR, "assets", f));
  }

  // Build live-demo bundles (esbuild) → dist/demos/<slug>.js
  let demoSlugs = new Set();
  try {
    const demoRes = await buildDemos();
    demoSlugs = new Set(demoRes.ok);
    console.log(`✓ 데모 ${demoRes.ok.length}개 번들${demoRes.failed.length ? ` (${demoRes.failed.length}개 스킵)` : ""}`);
  } catch (err) {
    console.warn("데모 번들 건너뜀:", err.message);
  }

  // Parse ideas
  const slugs = fs.readdirSync(IDEAS_DIR)
    .filter(s => fs.statSync(path.join(IDEAS_DIR, s)).isDirectory())
    .sort();
  const ideas = slugs.map(parseIdea);

  // data.json (for external consumers)
  fs.writeFileSync(path.join(OUT_DIR, "data.json"), JSON.stringify(
    ideas.map(i => ({ slug: i.slug, num: i.num, title: i.title, tagline: i.tagline, cat: i.cat.code, srcCount: i.srcCount, testCount: i.testCount, hasDemo: demoSlugs.has(i.slug) })),
    null, 2
  ));

  // Home
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), layout({
    title: "100 Monetization Ideas",
    description: "수익화 가능한 아이디어 100개와 각 아이디어의 MVP 스캐폴드",
    body: homeBody(ideas),
    base: "",
    isHome: true,
  }));

  // Details
  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    const dir = path.join(OUT_DIR, "ideas", idea.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), layout({
      title: `#${String(idea.num).padStart(3,"0")} ${idea.title} · 140 Ideas`,
      description: idea.tagline || idea.title,
      body: detailBody(idea, ideas[i - 1], ideas[i + 1], demoSlugs.has(idea.slug)),
      base: "../../",
      isHome: false,
    }));
  }

  // .nojekyll so underscores etc. are not stripped
  fs.writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");

  console.log(`✓ Built ${ideas.length} idea pages, ${demoSlugs.size} live demos → ${OUT_DIR}`);
}

build();
