// Safe Markdown -> HTML renderer. Pure functions.
// marked parses; sanitize-html strips dangerous tags/attrs so output is XSS-safe.
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "blockquote", "pre", "code",
  "ul", "ol", "li", "strong", "em", "del",
  "a", "img", "table", "thead", "tbody", "tr", "th", "td",
];

const SANITIZE_OPTS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title"],
    code: ["class"], // language-xxx for highlighting
    "*": [],
  },
  // Only allow safe URL schemes; blocks javascript:, data: (except images), etc.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  disallowedTagsMode: "discard",
};

marked.setOptions({ gfm: true, breaks: false });

/** Render Markdown to sanitized, XSS-safe HTML. */
export function renderMarkdown(md) {
  if (typeof md !== "string") throw new Error("markdown must be a string");
  const rawHtml = marked.parse(md);
  return sanitizeHtml(rawHtml, SANITIZE_OPTS);
}

/** Extract a heading outline (table of contents). */
export function extractToc(md) {
  const toc = [];
  const re = /^(#{1,6})\s+(.+?)\s*#*$/gm;
  let m;
  while ((m = re.exec(md))) {
    const text = m[2].trim();
    toc.push({
      level: m[1].length,
      text,
      slug: text.toLowerCase().replace(/[^\w가-힣\s-]/g, "").trim().replace(/\s+/g, "-"),
    });
  }
  return toc;
}

/** Strip markdown to a plain-text excerpt for previews/SEO. */
export function toPlainText(md, maxLen = 160) {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1).trimEnd() + "…" : text;
}
