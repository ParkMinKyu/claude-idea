// Email HTML linter core: detect features unsupported / risky across major email clients.
// Pure, dependency-free. Rules encode well-known limitations (Outlook/Gmail/Apple Mail).

/** A finding from the linter. */
// { rule, severity: "error"|"warning"|"info", message, client?: string }

const RULES = [
  {
    rule: "no-external-stylesheet",
    severity: "error",
    test: (html) => /<link\b[^>]*rel\s*=\s*["']?stylesheet/i.test(html),
    message: "외부 스타일시트(<link rel=stylesheet>)는 대부분 이메일 클라이언트에서 무시됩니다. 인라인 스타일을 사용하세요.",
    clients: ["Gmail", "Outlook", "Yahoo"],
  },
  {
    rule: "no-style-in-body",
    severity: "warning",
    test: (html) => {
      const bodyIdx = html.search(/<body[\s>]/i);
      if (bodyIdx === -1) return false;
      return /<style[\s>]/i.test(html.slice(bodyIdx));
    },
    message: "<body> 안의 <style> 블록은 Gmail에서 제거될 수 있습니다. <head>로 옮기고 인라인 백업을 두세요.",
    clients: ["Gmail"],
  },
  {
    rule: "no-flexbox-grid",
    severity: "error",
    test: (html) => /display\s*:\s*(flex|grid)/i.test(html),
    message: "flex/grid 레이아웃은 Outlook(Word 엔진)에서 지원되지 않습니다. 테이블 기반 레이아웃을 사용하세요.",
    clients: ["Outlook"],
  },
  {
    rule: "no-position-absolute",
    severity: "warning",
    test: (html) => /position\s*:\s*(absolute|fixed)/i.test(html),
    message: "position:absolute/fixed는 다수 클라이언트에서 무시됩니다.",
    clients: ["Outlook", "Gmail"],
  },
  {
    rule: "img-needs-alt",
    severity: "warning",
    test: (html) => {
      const imgs = html.match(/<img\b[^>]*>/gi) || [];
      return imgs.some((tag) => !/\balt\s*=/i.test(tag));
    },
    message: "alt 속성이 없는 <img>가 있습니다. 이미지 차단 시 빈 공간이 됩니다.",
  },
  {
    rule: "img-needs-dimensions",
    severity: "info",
    test: (html) => {
      const imgs = html.match(/<img\b[^>]*>/gi) || [];
      return imgs.some((tag) => !/\bwidth\s*=/i.test(tag));
    },
    message: "명시적 width가 없는 <img>가 있습니다. Outlook에서 깨질 수 있습니다.",
    clients: ["Outlook"],
  },
  {
    rule: "no-video-tag",
    severity: "error",
    test: (html) => /<video[\s>]/i.test(html),
    message: "<video> 태그는 대부분의 이메일 클라이언트에서 재생되지 않습니다.",
  },
  {
    rule: "no-script",
    severity: "error",
    test: (html) => /<script[\s>]/i.test(html),
    message: "<script>는 모든 이메일 클라이언트에서 제거됩니다(보안).",
  },
  {
    rule: "has-doctype",
    severity: "info",
    test: (html) => !/<!doctype/i.test(html),
    message: "DOCTYPE 선언이 없습니다. <!DOCTYPE html>을 권장합니다.",
    invertedMessageIsPresence: true,
  },
];

/** Count rough total size; clients clip large emails (Gmail ~102KB). */
export function byteSize(html) {
  return Buffer.byteLength(html, "utf8");
}

/** Run all rules over the HTML and return findings. */
export function lint(html, { gmailClipKb = 102 } = {}) {
  if (typeof html !== "string") throw new TypeError("html must be a string");
  const findings = [];
  for (const r of RULES) {
    if (r.test(html)) {
      findings.push({
        rule: r.rule,
        severity: r.severity,
        message: r.message,
        clients: r.clients || ["all"],
      });
    }
  }
  const size = byteSize(html);
  if (size > gmailClipKb * 1024) {
    findings.push({
      rule: "gmail-clipping",
      severity: "warning",
      message: `이메일 크기 ${(size / 1024).toFixed(1)}KB가 Gmail 클리핑 한도(${gmailClipKb}KB)를 초과합니다.`,
      clients: ["Gmail"],
    });
  }
  return findings;
}

/** Summarize findings into a pass/fail report. */
export function report(html, opts) {
  const findings = lint(html, opts);
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;
  return {
    passed: counts.error === 0,
    counts,
    sizeKb: Math.round((byteSize(html) / 1024) * 10) / 10,
    findings,
  };
}
