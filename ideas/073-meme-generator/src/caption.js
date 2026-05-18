// Caption layout helper: wraps text into lines that fit a max pixel width,
// given a measure-text function. We test it with a dummy measureFn so we
// don't need a real <canvas> in the test environment.
//
// Korean text has no inter-word spaces in many cases, so we fall back to
// per-character wrapping if a token doesn't fit.

export function wrapCaption({ text, maxWidth, measureFn, maxLines = 4 }) {
  if (typeof text !== 'string' || text.length === 0) return [];
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new Error('bad maxWidth');
  if (typeof measureFn !== 'function') throw new Error('measureFn required');

  // First split on whitespace, but if a token is still too wide,
  // greedily split by character.
  const tokens = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  const widthOf = (s) => measureFn(s).width;

  const pushChunk = (chunk) => {
    if (current === '') {
      current = chunk;
    } else if (widthOf(`${current} ${chunk}`) <= maxWidth) {
      current = `${current} ${chunk}`;
    } else {
      lines.push(current);
      current = chunk;
    }
  };

  for (const token of tokens) {
    if (widthOf(token) <= maxWidth) {
      pushChunk(token);
    } else {
      // Force per-character wrapping
      let buf = '';
      for (const ch of token) {
        const trial = buf + ch;
        if (widthOf(trial) > maxWidth && buf.length > 0) {
          pushChunk(buf);
          buf = ch;
        } else {
          buf = trial;
        }
      }
      if (buf) pushChunk(buf);
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = ellipsize(kept[maxLines - 1], maxWidth, measureFn);
    return kept;
  }
  return lines;
}

function ellipsize(line, maxWidth, measureFn) {
  let s = line;
  while (s.length > 0 && measureFn(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return `${s}…`;
}

// Determine caption font size: start large, shrink until line count <= maxLines.
export function autoFontSize({ text, width, maxLines, baseSize = 64, minSize = 18, measureAt }) {
  for (let size = baseSize; size >= minSize; size -= 2) {
    const measureFn = measureAt(size);
    const lines = wrapCaption({ text, maxWidth: width, measureFn, maxLines: maxLines + 1 });
    if (lines.length <= maxLines) return size;
  }
  return minSize;
}
