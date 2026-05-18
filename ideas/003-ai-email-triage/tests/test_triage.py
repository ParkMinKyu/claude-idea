import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.triage import (
    Email,
    Priority,
    TriageResult,
    classify_email,
    triage_with_reply,
)


def _fake_text_response(payload: dict) -> SimpleNamespace:
    block = SimpleNamespace(type="text", text=json.dumps(payload))
    return SimpleNamespace(content=[block])


def test_classify_email_urgent():
    fake = MagicMock()
    fake.messages.create.return_value = _fake_text_response(
        {"priority": "urgent", "needs_reply": True, "reason": "고객 긴급 문의"}
    )
    email = Email(id="1", sender="user@example.com", subject="긴급", body="내일까지 답변 부탁드립니다.")
    result = classify_email(email, client=fake)
    assert result.priority == Priority.URGENT
    assert result.needs_reply is True
    assert "고객" in result.reason


def test_classify_email_newsletter():
    fake = MagicMock()
    fake.messages.create.return_value = _fake_text_response(
        {"priority": "newsletter", "needs_reply": False, "reason": "마케팅 메일"}
    )
    email = Email(id="2", sender="news@brand.com", subject="주간 소식", body="안녕하세요 구독자님")
    result = classify_email(email, client=fake)
    assert result.priority == Priority.NEWSLETTER
    assert result.draft_reply is None


def test_triage_with_reply_attaches_draft():
    fake = MagicMock()
    fake.messages.create.side_effect = [
        _fake_text_response(
            {"priority": "urgent", "needs_reply": True, "reason": "회의 일정 조율"}
        ),
        SimpleNamespace(
            content=[SimpleNamespace(type="text", text="안녕하세요, 회의는 [TBD]에 가능합니다.")]
        ),
    ]
    email = Email(id="3", sender="boss@co.com", subject="회의", body="언제 가능한가요?")
    result = triage_with_reply(email, client=fake)
    assert result.draft_reply is not None
    assert "[TBD]" in result.draft_reply


def test_triage_result_serializable():
    r = TriageResult(
        email_id="x", priority=Priority.NORMAL, needs_reply=False, reason="단순 공유"
    )
    j = r.model_dump_json()
    assert "normal" in j
