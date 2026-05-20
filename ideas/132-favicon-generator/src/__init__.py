"""Favicon generator package: size planning, manifest + HTML head builders."""
from .favicon import (
    Size,
    DEFAULT_SIZES,
    plan_sizes,
    output_filename,
    build_manifest,
    build_html_tags,
    nearest_source,
)

__all__ = [
    "Size",
    "DEFAULT_SIZES",
    "plan_sizes",
    "output_filename",
    "build_manifest",
    "build_html_tags",
    "nearest_source",
]
