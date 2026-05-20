"""Detect hardcoded secrets in source code.

Two complementary strategies:
1. Named regex rules for well-known credential shapes (AWS keys, GitHub PATs,
   private key headers, Slack/Stripe tokens, generic assignments).
2. Shannon-entropy screening for high-randomness strings that look like keys
   even when they don't match a known vendor pattern.

Pure, stdlib-only, deterministic, fully testable.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Finding:
    rule: str
    line_no: int
    column: int
    match: str        # redacted by callers when displayed
    entropy: float


# (name, compiled regex). Ordered: most specific first.
PATTERNS: list[tuple[str, re.Pattern]] = [
    ("aws-access-key-id", re.compile(r"\b(AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("github-pat", re.compile(r"\bghp_[A-Za-z0-9]{36}\b")),
    ("github-fine-grained-pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{22,}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("stripe-secret-key", re.compile(r"\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}\b")),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("private-key-header", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    (
        "generic-assignment",
        re.compile(
            r"""(?ix)
            \b(?:api[_-]?key|secret|token|passwd|password|access[_-]?key)\b
            \s*[:=]\s*
            ['"]([^'"\s]{8,})['"]
            """
        ),
    ),
]

# Substrings that signal a placeholder/example, not a real secret.
_PLACEHOLDERS = (
    "example",
    "your_",
    "xxxx",
    "changeme",
    "placeholder",
    "dummy",
    "redacted",
    "<",
)


def shannon_entropy(s: str) -> float:
    """Shannon entropy in bits per character (0 for empty/uniform-1-char)."""
    if not s:
        return 0.0
    counts: dict[str, int] = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    n = len(s)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def _looks_placeholder(value: str) -> bool:
    low = value.lower()
    return any(p in low for p in _PLACEHOLDERS)


def _high_entropy_tokens(line: str, min_len: int, min_entropy: float):
    """Yield (token, column) for base64/hex-ish tokens with high entropy."""
    for m in re.finditer(r"[A-Za-z0-9+/=_\-]{%d,}" % min_len, line):
        tok = m.group(0)
        if _looks_placeholder(tok):
            continue
        ent = shannon_entropy(tok)
        if ent >= min_entropy:
            yield tok, m.start(), ent


def scan_line(
    line: str,
    line_no: int,
    *,
    entropy_min_len: int = 20,
    entropy_threshold: float = 4.0,
) -> list[Finding]:
    findings: list[Finding] = []
    seen_spans: set[int] = set()

    for name, pat in PATTERNS:
        for m in pat.finditer(line):
            # Only generic-assignment captures the secret in group(1); for vendor
            # patterns the (optional) group is a prefix, so report the full match.
            value = m.group(1) if name == "generic-assignment" else m.group(0)
            if _looks_placeholder(value):
                continue
            findings.append(
                Finding(
                    rule=name,
                    line_no=line_no,
                    column=m.start() + 1,
                    match=value,
                    entropy=round(shannon_entropy(value), 3),
                )
            )
            seen_spans.add(m.start())

    # entropy pass for anything the named rules missed
    for tok, col, ent in _high_entropy_tokens(line, entropy_min_len, entropy_threshold):
        if col in seen_spans:
            continue
        findings.append(
            Finding(
                rule="high-entropy-string",
                line_no=line_no,
                column=col + 1,
                match=tok,
                entropy=round(ent, 3),
            )
        )
    return findings


def scan_text(text: str, **kwargs) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(text.splitlines(), start=1):
        findings.extend(scan_line(line, i, **kwargs))
    return findings


def redact(secret: str) -> str:
    """Show only first/last 2 chars for safe reporting."""
    if len(secret) <= 6:
        return "*" * len(secret)
    return secret[:2] + "*" * (len(secret) - 4) + secret[-2:]
