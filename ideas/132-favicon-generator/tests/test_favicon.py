import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.favicon import (  # noqa: E402
    DEFAULT_SIZES,
    Size,
    build_html_tags,
    build_manifest,
    manifest_json,
    nearest_source,
    output_filename,
    plan_sizes,
)


def test_plan_sizes_never_upscales():
    plan = plan_sizes(100)
    assert all(s.px <= 100 for s in plan)
    assert max(s.px for s in plan) == 48  # 180/192/512 dropped


def test_plan_sizes_full_set_for_large_source():
    plan = plan_sizes(1024)
    assert {s.px for s in plan} == {s.px for s in DEFAULT_SIZES}
    # sorted ascending
    assert [s.px for s in plan] == sorted(s.px for s in plan)


def test_plan_sizes_rejects_nonpositive():
    with pytest.raises(ValueError):
        plan_sizes(0)


def test_output_filename_naming():
    assert output_filename(Size(180, "apple")) == "apple-touch-icon.png"
    assert output_filename(Size(32, "favicon")) == "icon-32x32.png"
    assert output_filename(Size(270, "ms")) == "mstile-270x270.png"


def test_build_manifest_structure():
    m = build_manifest(plan_sizes(1024), "My App", "#112233")
    assert m["name"] == "My App"
    assert m["theme_color"] == "#112233"
    assert m["display"] == "standalone"
    # only favicon/android icons land in the manifest
    sizes_in = {icon["sizes"] for icon in m["icons"]}
    assert "192x192" in sizes_in and "512x512" in sizes_in
    assert "180x180" not in sizes_in  # apple is not in manifest icons


def test_build_manifest_requires_name():
    with pytest.raises(ValueError):
        build_manifest(plan_sizes(64), "")


def test_manifest_json_is_valid_json():
    parsed = json.loads(manifest_json(plan_sizes(512), "X"))
    assert parsed["short_name"] == "X"


def test_html_tags_cover_apple_and_manifest():
    tags = build_html_tags(plan_sizes(1024))
    joined = "\n".join(tags)
    assert 'rel="apple-touch-icon"' in joined
    assert 'rel="manifest"' in joined
    assert 'msapplication-TileImage' in joined


def test_nearest_source_prefers_no_upscale():
    assert nearest_source(32, [16, 64, 256]) == 64
    assert nearest_source(512, [16, 64, 256]) == 256  # fallback to largest
    with pytest.raises(ValueError):
        nearest_source(16, [])
