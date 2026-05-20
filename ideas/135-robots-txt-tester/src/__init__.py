"""robots.txt parser and matcher (RFC 9309-style)."""
from .robots import (
    Rule,
    RobotsTxt,
    parse,
    path_match,
    can_fetch,
)

__all__ = ["Rule", "RobotsTxt", "parse", "path_match", "can_fetch"]
