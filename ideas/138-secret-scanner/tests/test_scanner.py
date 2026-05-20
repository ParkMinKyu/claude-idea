import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.scanner import (  # noqa: E402
    redact,
    scan_line,
    scan_text,
    shannon_entropy,
)


def rules(findings):
    return {f.rule for f in findings}


def test_shannon_entropy_bounds():
    assert shannon_entropy("") == 0.0
    assert shannon_entropy("aaaa") == 0.0          # single symbol -> 0 bits
    assert abs(shannon_entropy("ab") - 1.0) < 1e-9  # two equally likely -> 1 bit
    assert shannon_entropy("abcd") == 2.0


def test_detects_aws_key():
    f = scan_line("aws_key = AKIAIOSFODNN7EXAMPLE", 1)
    # placeholder filter drops it because it contains "EXAMPLE"
    assert "aws-access-key-id" not in rules(f)
    f2 = scan_line("aws_key = AKIA1234567890ABCDEF", 1)
    assert "aws-access-key-id" in rules(f2)


def test_detects_github_pat():
    line = "token=ghp_" + "a1B2c3D4e5" * 3 + "abcdef"  # 36 chars after ghp_
    f = scan_line(line, 3)
    found = [x for x in f if x.rule == "github-pat"]
    assert found and found[0].line_no == 3


def test_detects_private_key_header():
    f = scan_line("-----BEGIN RSA PRIVATE KEY-----", 1)
    assert "private-key-header" in rules(f)


def test_generic_assignment_rule():
    f = scan_line('password = "s3cr3tValue123"', 1)
    assert "generic-assignment" in rules(f)
    assert any(x.match == "s3cr3tValue123" for x in f)


def test_placeholder_is_ignored():
    f = scan_line('api_key = "your_api_key_here"', 1)
    assert rules(f) == set() or "high-entropy-string" not in rules(f)
    f2 = scan_line('api_key = "example_token_value"', 1)
    assert "generic-assignment" not in rules(f2)


def test_high_entropy_catches_unknown_key():
    # random-looking 40-char base64 not matching any vendor pattern
    blob = "Zk8x2Qp9LmN4vT7wRb1cYs6dHj3uFa0eGiKoPq2X"
    f = scan_line(f"const k = '{blob}'", 1)
    assert "high-entropy-string" in rules(f)


def test_low_entropy_not_flagged():
    f = scan_line("const path = '/usr/local/bin/python3node'", 1)
    assert "high-entropy-string" not in rules(f)


def test_scan_text_reports_correct_line_numbers():
    text = "ok line\npassword = \"hunter2hunter2\"\nanother\n"
    findings = scan_text(text)
    gen = [f for f in findings if f.rule == "generic-assignment"]
    assert gen and gen[0].line_no == 2


def test_redact_masks_middle():
    assert redact("abcd") == "****"
    assert redact("abcdefghij") == "ab******ij"
