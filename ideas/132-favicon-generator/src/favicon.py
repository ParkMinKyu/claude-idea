"""Favicon multi-size generation core.

Pure logic: decide which icon sizes to emit, build the web app manifest and the
HTML <head> tags, and pick the best source render size for each output. Image
resampling itself is delegated to Pillow at the edge (see render.py), but all
planning is dependency-free and unit-testable.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Size:
    px: int          # square edge length in pixels
    purpose: str     # "favicon" | "apple" | "android" | "ms"


# The pragmatic modern favicon set (covers browsers, iOS, Android, Windows tiles).
DEFAULT_SIZES: tuple[Size, ...] = (
    Size(16, "favicon"),
    Size(32, "favicon"),
    Size(48, "favicon"),
    Size(180, "apple"),     # apple-touch-icon
    Size(192, "android"),   # android home screen
    Size(512, "android"),   # splash / store
    Size(270, "ms"),        # MS tile
)


def plan_sizes(source_px: int, sizes: Iterable[Size] = DEFAULT_SIZES) -> list[Size]:
    """Return sizes we can produce from a square source.

    We never upscale: any requested size larger than the source is dropped so we
    don't ship blurry icons. Result is sorted ascending and de-duplicated by px.
    """
    if source_px <= 0:
        raise ValueError("source_px must be positive")
    seen: dict[int, Size] = {}
    for s in sizes:
        if s.px <= source_px and s.px not in seen:
            seen[s.px] = s
    return [seen[k] for k in sorted(seen)]


def output_filename(size: Size) -> str:
    if size.purpose == "apple":
        return "apple-touch-icon.png"
    if size.purpose == "ms":
        return f"mstile-{size.px}x{size.px}.png"
    return f"icon-{size.px}x{size.px}.png"


def build_manifest(sizes: Iterable[Size], name: str, theme_color: str = "#ffffff") -> dict:
    """Build a Web App Manifest dict (PWA-compatible)."""
    icons = []
    for s in sizes:
        if s.purpose in ("android", "favicon"):
            icons.append(
                {
                    "src": "/" + output_filename(s),
                    "sizes": f"{s.px}x{s.px}",
                    "type": "image/png",
                }
            )
    if not name:
        raise ValueError("name is required")
    return {
        "name": name,
        "short_name": name[:12],
        "icons": icons,
        "theme_color": theme_color,
        "background_color": "#ffffff",
        "display": "standalone",
    }


def build_html_tags(sizes: Iterable[Size]) -> list[str]:
    """Build the <head> link tags for the given sizes (deterministic order)."""
    tags: list[str] = []
    for s in sorted(sizes, key=lambda x: (x.purpose, x.px)):
        fn = "/" + output_filename(s)
        if s.purpose == "apple":
            tags.append(f'<link rel="apple-touch-icon" sizes="{s.px}x{s.px}" href="{fn}">')
        elif s.purpose == "favicon":
            tags.append(f'<link rel="icon" type="image/png" sizes="{s.px}x{s.px}" href="{fn}">')
        elif s.purpose == "android":
            tags.append(f'<link rel="icon" type="image/png" sizes="{s.px}x{s.px}" href="{fn}">')
        elif s.purpose == "ms":
            tags.append(f'<meta name="msapplication-TileImage" content="{fn}">')
    tags.append('<link rel="manifest" href="/site.webmanifest">')
    return tags


def nearest_source(target_px: int, available: Iterable[int]) -> int:
    """Choose the smallest available render >= target (avoids upscaling blur);
    if none is large enough, fall back to the largest available."""
    avail = sorted(set(available))
    if not avail:
        raise ValueError("no available sources")
    bigger = [a for a in avail if a >= target_px]
    return bigger[0] if bigger else avail[-1]


def manifest_json(sizes: Iterable[Size], name: str, theme_color: str = "#ffffff") -> str:
    return json.dumps(build_manifest(sizes, name, theme_color), indent=2)
