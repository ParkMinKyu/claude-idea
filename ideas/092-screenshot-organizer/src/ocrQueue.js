// Queue + post-processing for OCR jobs. OCR engine is injected for testing.

export function createQueue({ ocr, concurrency = 2 }) {
  const pending = [];
  const running = new Set();
  const results = new Map(); // path -> { text, error, durationMs }

  async function worker(item) {
    const t0 = Date.now();
    try {
      const text = await ocr(item.path);
      results.set(item.path, { text: postProcess(text), durationMs: Date.now() - t0 });
      item.resolve(results.get(item.path));
    } catch (err) {
      results.set(item.path, { error: err.message, durationMs: Date.now() - t0 });
      item.reject(err);
    } finally {
      running.delete(item);
      schedule();
    }
  }

  function schedule() {
    while (running.size < concurrency && pending.length > 0) {
      const item = pending.shift();
      running.add(item);
      worker(item);
    }
  }

  return {
    enqueue(path) {
      return new Promise((resolve, reject) => {
        pending.push({ path, resolve, reject });
        schedule();
      });
    },
    stats() {
      return { pending: pending.length, running: running.size, done: results.size };
    },
    get(path) {
      return results.get(path);
    },
  };
}

export function postProcess(text) {
  if (!text) return "";
  return text
    .replace(/[ \t]+/g, " ")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2)
    .join("\n");
}

export function searchTokens(query) {
  // FTS5-style: split, drop short tokens, prepend prefix wildcard for partial.
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => `${t}*`);
}

export function rank(matches) {
  // matches: [{ path, text, score }]
  return [...matches].sort((a, b) => b.score - a.score);
}
