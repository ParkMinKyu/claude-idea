import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.robots import can_fetch, parse, path_match  # noqa: E402

SAMPLE = """
# example robots
User-agent: *
Disallow: /private
Allow: /private/public
Disallow: /tmp/

User-agent: BadBot
Disallow: /

Sitemap: https://e.com/sitemap.xml
Crawl-delay: 5
"""


def test_parse_groups_and_sitemap():
    r = parse(SAMPLE)
    assert "*" in r.groups
    assert "badbot" in r.groups
    assert r.sitemaps == ["https://e.com/sitemap.xml"]
    assert r.crawl_delay.get("badbot") == 5.0


def test_disallow_blocks_prefix():
    r = parse(SAMPLE)
    assert can_fetch(r, "Googlebot", "/private/secret") is False
    assert can_fetch(r, "Googlebot", "/tmp/x") is False


def test_longest_match_allow_wins_over_disallow():
    r = parse(SAMPLE)
    # /private/public is longer + Allow -> wins over /private Disallow
    assert can_fetch(r, "Googlebot", "/private/public/page") is True


def test_default_allowed_when_no_match():
    r = parse(SAMPLE)
    assert can_fetch(r, "Googlebot", "/about") is True


def test_specific_agent_group_beats_wildcard():
    r = parse(SAMPLE)
    # BadBot is fully disallowed by its own group even though /about is fine for *
    assert can_fetch(r, "BadBot/1.0", "/about") is False


def test_wildcard_and_anchor_patterns():
    r = parse("User-agent: *\nDisallow: /*.pdf$\nDisallow: /a/*/b\n")
    assert can_fetch(r, "x", "/files/report.pdf") is False
    assert can_fetch(r, "x", "/files/report.pdf?x=1") is True  # $ anchors end
    assert can_fetch(r, "x", "/a/zzz/b") is False
    assert can_fetch(r, "x", "/a/b") is True  # needs something between


def test_empty_disallow_allows_all():
    r = parse("User-agent: *\nDisallow:\n")
    assert can_fetch(r, "x", "/anything") is True


def test_path_match_helper():
    assert path_match("/p", "/private") is True
    assert path_match("/p$", "/private") is False
    assert path_match("", "/x") is False


def test_can_fetch_accepts_full_url():
    r = parse("User-agent: *\nDisallow: /private\n")
    assert can_fetch(r, "x", "https://e.com/private/x") is False
    assert can_fetch(r, "x", "https://e.com/public") is True
