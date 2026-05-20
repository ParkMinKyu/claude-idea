// Render classified changes into a markdown changelog. Pure.
import { suggestBump } from "./classify.js";

const HEADINGS = {
  breaking: "⚠️ Breaking 변경",
  "non-breaking": "✨ 호환 변경",
  info: "ℹ️ 참고",
};

export function toChangelog(result, { title = "API 변경 로그" } = {}) {
  const lines = [`# ${title}`, "", `제안 버전 변경: **${suggestBump(result)}**`, ""];
  for (const sev of ["breaking", "non-breaking", "info"]) {
    const items = result.buckets[sev];
    if (!items.length) continue;
    lines.push(`## ${HEADINGS[sev]}`);
    for (const c of items) {
      const loc = c.method ? `\`${c.method.toUpperCase()} ${c.path}\`` : `\`${c.path}\``;
      lines.push(`- ${loc}: ${c.detail}`);
    }
    lines.push("");
  }
  if (result.annotated.length === 0) lines.push("_변경 사항 없음_");
  return lines.join("\n").trimEnd();
}
