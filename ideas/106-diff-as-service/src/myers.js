// Myers O(ND) diff algorithm over arrays of lines/tokens. Pure functions.
// Reference: Eugene Myers, "An O(ND) Difference Algorithm and Its Variations" (1986).

/**
 * Compute the shortest edit script between two sequences.
 * Returns ops: [{ type: "equal"|"insert"|"delete", value }]
 */
export function diffSequences(a, b, eq = (x, y) => x === y) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const v = new Map();
  v.set(1, 0);
  const trace = [];

  for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x;
      const down = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1));
      if (down) x = v.get(k + 1) ?? 0;
      else x = (v.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && eq(a[x], b[y])) {
        x++;
        y++;
      }
      v.set(k, x);
      if (x >= n && y >= m) {
        return backtrack(trace, a, b, n, m);
      }
    }
  }
  return [];
}

function backtrack(trace, a, b, n, m) {
  const ops = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d > 0; d--) {
    const v = trace[d];
    const k = x - y;
    const down = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1));
    const prevK = down ? k + 1 : k - 1;
    const prevX = v.get(prevK) ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push({ type: "equal", value: a[x - 1] });
      x--;
      y--;
    }
    if (d > 0) {
      if (down) ops.push({ type: "insert", value: b[prevY] });
      else ops.push({ type: "delete", value: a[prevX] });
    }
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    ops.push({ type: "equal", value: a[x - 1] });
    x--;
    y--;
  }
  return ops.reverse();
}

/** Line-based diff of two text blobs. */
export function diffLines(oldText, newText) {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  return diffSequences(a, b);
}

/** Render a unified-diff-style string from line ops. */
export function toUnified(ops) {
  return ops
    .map((op) => {
      const prefix = op.type === "insert" ? "+" : op.type === "delete" ? "-" : " ";
      return prefix + op.value;
    })
    .join("\n");
}

/** Summary counts for the API response. */
export function diffStats(ops) {
  return ops.reduce(
    (acc, op) => {
      if (op.type === "insert") acc.insertions++;
      else if (op.type === "delete") acc.deletions++;
      else acc.unchanged++;
      return acc;
    },
    { insertions: 0, deletions: 0, unchanged: 0 }
  );
}
