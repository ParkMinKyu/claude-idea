"""Fingerprint stack traces to group similar errors together."""
from __future__ import annotations

import hashlib
import re
from typing import Iterable

# Lines of the form "  File \"path/to/foo.py\", line 12, in func" or similar.
_PY_FRAME = re.compile(r'File "(?P<file>[^"]+)", line \d+, in (?P<func>\S+)')
# JavaScript v8 style: "    at funcName (path/to/foo.js:12:7)" or "    at path/to/foo.js:12:7"
_JS_FRAME = re.compile(
    r"at (?:(?P<func>[\w.<>$]+) )?\(?(?P<file>[^():\s]+):\d+:\d+\)?"
)


def normalize_path(path: str) -> str:
    """Strip volatile path prefixes so the same module looks identical across machines."""
    p = path.replace("\\", "/")
    # Drop common roots
    for marker in ("/node_modules/", "/site-packages/", "/dist/", "/build/"):
        idx = p.find(marker)
        if idx >= 0:
            return p[idx + len(marker) :]
    parts = p.split("/")
    return "/".join(parts[-2:]) if len(parts) >= 2 else p


def extract_frames(stack: str) -> list[tuple[str, str]]:
    """Return list of (file, func) pairs detected from a stack trace string."""
    frames: list[tuple[str, str]] = []
    for line in stack.splitlines():
        m = _PY_FRAME.search(line) or _JS_FRAME.search(line)
        if not m:
            continue
        frames.append((normalize_path(m.group("file")), m.group("func") or "<anon>"))
    return frames


def fingerprint(error_type: str, stack: str, frame_limit: int = 5) -> str:
    """Stable hash over (error type + top N normalized frames). Ignores line numbers."""
    frames = extract_frames(stack)[:frame_limit]
    parts: Iterable[str] = (error_type, *(f"{f}:{fn}" for f, fn in frames))
    h = hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()
    return h[:16]
