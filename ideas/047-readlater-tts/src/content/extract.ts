import { Readability } from "@mozilla/readability";

export interface Extracted {
  title: string;
  text: string;
  byline?: string;
  excerpt?: string;
}

export function extractArticle(doc: Document): Extracted | null {
  const cloned = doc.cloneNode(true) as Document;
  const article = new Readability(cloned).parse();
  if (!article) return null;
  return {
    title: article.title ?? doc.title,
    text: stripHtml(article.content ?? ""),
    byline: article.byline ?? undefined,
    excerpt: article.excerpt ?? undefined,
  };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Run as content script: extract & send to background.
(async () => {
  if (typeof window === "undefined") return;
  const extracted = extractArticle(document);
  if (extracted) {
    chrome.runtime.sendMessage({ type: "extracted", payload: extracted });
  }
})();
