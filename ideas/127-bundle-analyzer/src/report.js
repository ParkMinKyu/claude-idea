// Markdown diff table.
function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}
function signed(bytes) {
  const s = bytes >= 0 ? "+" : "";
  return `${s}${(bytes / 1024).toFixed(1)}KB`;
}

export function toMarkdown(result) {
  const lines = [];
  lines.push(`### 번들 사이즈 검사: ${result.passed ? "통과 ✅" : "실패 ❌"}`);
  lines.push("");
  lines.push("| 자산 | 변경 전 | 변경 후 | 증감 | 상태 |");
  lines.push("|---|---:|---:|---:|---|");
  for (const a of result.diff.assets) {
    if (a.status === "unchanged") continue;
    lines.push(`| \`${a.name}\` | ${kb(a.baselineSize)} | ${kb(a.currentSize)} | ${signed(a.delta)} | ${a.status} |`);
  }
  lines.push(`| **합계 증감** | | | **${signed(result.diff.totalDelta)}** | |`);
  if (result.violations.length) {
    lines.push("");
    lines.push("**위반:**");
    for (const v of result.violations) lines.push(`- ${v.message}`);
  }
  return lines.join("\n");
}
