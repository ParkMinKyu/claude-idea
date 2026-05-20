// Render an estimate as a markdown table for PR comments.
export function toMarkdown(estimate) {
  const lines = [];
  lines.push("| 리소스 | 액션 | 변경 전($/월) | 변경 후($/월) | 증감 |");
  lines.push("|---|---|---:|---:|---:|");
  for (const it of estimate.items) {
    const flag = it.supported ? "" : " ⚠️";
    lines.push(
      `| \`${it.address}\` | ${it.action} | ${it.monthlyBefore} | ${it.monthlyAfter} | ${signed(it.delta)}${flag} |`
    );
  }
  lines.push(`| **합계** | | ${estimate.totalBefore} | ${estimate.totalAfter} | **${signed(estimate.delta)}** |`);
  return lines.join("\n");
}

function signed(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}
