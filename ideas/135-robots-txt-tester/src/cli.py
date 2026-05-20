"""CLI: python -m src.cli <robots.txt path> <user-agent> <url/path>
Prints ALLOWED / BLOCKED and exits 0 / 1.
"""
import sys

from .robots import can_fetch, parse


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: cli.py <robots.txt> <user-agent> <url-or-path>", file=sys.stderr)
        return 2
    path, ua, target = argv
    with open(path, encoding="utf-8") as f:
        robots = parse(f.read())
    ok = can_fetch(robots, ua, target)
    print("ALLOWED" if ok else "BLOCKED", target, "for", ua)
    return 0 if ok else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
