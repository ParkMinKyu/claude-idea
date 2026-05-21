import { normalizeUrl, buildSitemap } from "../ideas/134-sitemap-generator/src/sitemap.js";

const DEFAULT_URLS = [
  "https://example.com/",
  "https://example.com/about",
  "https://example.com/blog/?utm_source=newsletter",
  "https://example.com/blog/post-1/",
  "https://example.com/contact#form",
  "https://example.com/about",
].join("\n");

window.__DEMO_SPEC__ = {
  description:
    "URL 목록을 정규화(추적 파라미터 제거·해시 제거·중복 제거)한 뒤 표준 sitemap.xml 문서를 생성합니다.",
  fields: [
    { name: "urls", type: "textarea", label: "URL 목록 (줄바꿈 구분)", rows: 8, default: DEFAULT_URLS },
    {
      name: "changefreq",
      type: "select",
      label: "변경 빈도 (changefreq)",
      default: "weekly",
      options: [
        { value: "", label: "(없음)" },
        { value: "daily", label: "daily" },
        { value: "weekly", label: "weekly" },
        { value: "monthly", label: "monthly" },
      ],
    },
    { name: "priority", type: "number", label: "우선순위 (priority, 0~1)", default: 0.8 },
  ],
  run(v) {
    const raw = String(v.urls || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!raw.length) {
      return [{ label: "오류", type: "error", value: "URL을 한 개 이상 입력하세요." }];
    }
    const seen = new Set();
    const pages = [];
    const invalid = [];
    for (const u of raw) {
      const norm = normalizeUrl(u, u);
      if (!norm) {
        invalid.push(u);
        continue;
      }
      if (seen.has(norm)) continue;
      seen.add(norm);
      const page = { url: norm };
      if (v.changefreq) page.changefreq = v.changefreq;
      const pr = Number(v.priority);
      if (!Number.isNaN(pr)) page.priority = Math.max(0, Math.min(1, pr));
      pages.push(page);
    }
    const xml = buildSitemap(pages);
    const out = [
      { label: "포함된 URL", type: "badge", value: `${pages.length}개`, tone: "good" },
    ];
    if (invalid.length)
      out.push({ label: "무시된 잘못된 URL", type: "list", value: invalid });
    out.push({ label: "정규화된 URL", type: "list", value: pages.map((p) => p.url) });
    out.push({ label: "sitemap.xml", type: "code", value: xml });
    return out;
  },
};
