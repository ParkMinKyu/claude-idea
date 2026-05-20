"""Edge layer: actually resize an image into the planned favicon set.

Requires Pillow (see requirements.txt). Kept thin and side-effecting so the core
planning logic stays pure and testable without image libraries.
"""
from __future__ import annotations

import os

from .favicon import DEFAULT_SIZES, plan_sizes, output_filename, manifest_json


def generate(source_path: str, out_dir: str, app_name: str) -> list[str]:  # pragma: no cover
    from PIL import Image  # imported lazily so tests don't need Pillow

    img = Image.open(source_path).convert("RGBA")
    side = min(img.size)  # crop to square (center)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side))

    os.makedirs(out_dir, exist_ok=True)
    sizes = plan_sizes(side)
    written: list[str] = []
    for s in sizes:
        resized = img.resize((s.px, s.px), Image.LANCZOS)
        path = os.path.join(out_dir, output_filename(s))
        resized.save(path)
        written.append(path)

    with open(os.path.join(out_dir, "site.webmanifest"), "w", encoding="utf-8") as f:
        f.write(manifest_json(sizes, app_name))
    written.append(os.path.join(out_dir, "site.webmanifest"))
    return written
