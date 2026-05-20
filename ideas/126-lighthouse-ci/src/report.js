// Markdown report for performance evaluation.
export function toMarkdown(result) {
  const lines = [];
  lines.push(`### 성능 검사: ${result.passed ? "통과 ✅" : "실패 ❌"}`);
  lines.push("");
  lines.push("| 지표 | 값 |");
  lines.push("|---|---:|");
  for (const [k, v] of Object.entries(result.metrics)) {
    if (v != null) lines.push(`| ${k} | ${v} |`);
  }
  if (result.violations.length) {
    lines.push("");
    lines.push("**위반:**");
    for (const v of result.violations) lines.push(`- ${v.message}`);
  }
  return lines.join("\n");
}
