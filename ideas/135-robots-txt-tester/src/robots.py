"""robots.txt parser + matcher following RFC 9309 semantics.

Key rules implemented:
- Group user-agent lines and their Allow/Disallow directives.
- Most-specific user-agent group wins (exact token > '*').
- Within a group, the *longest matching path pattern* wins; on a tie, Allow > Disallow.
- '*' matches any run of characters, '$' anchors to end of path.
- An empty Disallow value means "allow everything".

Pure, stdlib-only, fully testable.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlsplit, unquote


@dataclass
class Rule:
    allow: bool          # True = Allow, False = Disallow
    pattern: str         # raw path pattern (may contain * and $)


@dataclass
class RobotsTxt:
    # user-agent token (lowercase) -> list[Rule]
    groups: dict[str, list[Rule]] = field(default_factory=dict)
    sitemaps: list[str] = field(default_factory=list)
    crawl_delay: dict[str, float] = field(default_factory=dict)


def parse(text: str) -> RobotsTxt:
    robots = RobotsTxt()
    current_agents: list[str] = []
    # Track whether the previous non-comment line was a user-agent (to group consecutive UAs).
    last_was_agent = False

    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue
        field_name, _, value = line.partition(":")
        field_name = field_name.strip().lower()
        value = value.strip()

        if field_name == "user-agent":
            ua = value.lower()
            if not last_was_agent:
                current_agents = []
            current_agents.append(ua)
            robots.groups.setdefault(ua, [])
            last_was_agent = True
            continue

        last_was_agent = False
        if field_name in ("allow", "disallow"):
            if not current_agents:
                continue
            rule = Rule(allow=(field_name == "allow"), pattern=value)
            for ua in current_agents:
                robots.groups[ua].append(rule)
        elif field_name == "sitemap":
            robots.sitemaps.append(value)
        elif field_name == "crawl-delay":
            try:
                for ua in current_agents or ["*"]:
                    robots.crawl_delay[ua] = float(value)
            except ValueError:
                pass

    return robots


def _pattern_to_regex(pattern: str) -> re.Pattern:
    """Translate a robots path pattern (* and $) into a compiled regex."""
    anchored_end = pattern.endswith("$")
    body = pattern[:-1] if anchored_end else pattern
    out = ["^"]
    for ch in body:
        if ch == "*":
            out.append(".*")
        else:
            out.append(re.escape(ch))
    if anchored_end:
        out.append("$")
    return re.compile("".join(out))


def path_match(pattern: str, path: str) -> bool:
    """Does a robots pattern match the start of a request path?"""
    if pattern == "":
        return False  # empty Disallow matches nothing (i.e. allows all)
    return _pattern_to_regex(pattern).match(path) is not None


def _select_group(robots: RobotsTxt, user_agent: str) -> list[Rule]:
    ua = user_agent.lower()
    # exact/substring token match beats '*'
    for token, rules in robots.groups.items():
        if token != "*" and token in ua:
            return rules
    return robots.groups.get("*", [])


def can_fetch(robots: RobotsTxt, user_agent: str, url_or_path: str) -> bool:
    """Return True if user_agent may fetch the path under these rules."""
    split = urlsplit(url_or_path)
    path = split.path or "/"
    if split.query:
        path += "?" + split.query
    path = unquote(path)

    rules = _select_group(robots, user_agent)
    best: tuple[int, bool] | None = None  # (pattern length, allow)
    for rule in rules:
        if path_match(rule.pattern, path):
            length = len(rule.pattern.rstrip("$"))
            # longest pattern wins; tie -> Allow wins
            if best is None or length > best[0] or (length == best[0] and rule.allow and not best[1]):
                best = (length, rule.allow)
    if best is None:
        return True  # nothing matched -> allowed by default
    return best[1]
