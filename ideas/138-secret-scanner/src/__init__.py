"""Secret scanner: regex patterns + entropy-based detection."""
from .scanner import (
    Finding,
    PATTERNS,
    shannon_entropy,
    scan_line,
    scan_text,
    redact,
)

__all__ = [
    "Finding",
    "PATTERNS",
    "shannon_entropy",
    "scan_line",
    "scan_text",
    "redact",
]
