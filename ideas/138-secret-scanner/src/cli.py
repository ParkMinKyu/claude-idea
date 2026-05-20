"""CLI: python -m src.cli <file> [<file> ...]
Prints findings (redacted) and exits 1 if any secret is found.
"""
import sys

from .scanner import redact, scan_text


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: cli.py <file> [file ...]", file=sys.stderr)
        return 2
    total = 0
    for path in argv:
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                text = f.read()
        except OSError as e:
            print(f"skip {path}: {e}", file=sys.stderr)
            continue
        for f in scan_text(text):
            total += 1
            print(f"{path}:{f.line_no}:{f.column} [{f.rule}] {redact(f.match)} (entropy={f.entropy})")
    if total:
        print(f"\n{total} potential secret(s) found.", file=sys.stderr)
    return 1 if total else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
