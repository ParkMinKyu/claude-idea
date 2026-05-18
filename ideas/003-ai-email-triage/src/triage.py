"""이메일 우선순위 분류 + 답장 초안 생성 코어."""
from __future__ import annotations

import json
import os
from enum import Enum
from typing import Optional

import anthropic
from pydantic import BaseModel, Field


class Priority(str, Enum):
    URGENT = "urgent"
    NORMAL = "normal"
    NEWSLETTER = "newsletter"
    SPAM = "spam"


class Email(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    snippet: Optional[str] = None


class TriageResult(BaseModel):
    email_id: str
    priority: Priority
    needs_reply: bool
    reason: str = Field(..., description="분류 이유 한 줄")
    draft_reply: Optional[str] = None


SYSTEM_PROMPT = """당신은 이메일 비서입니다.
주어진 이메일을 분석해 다음 JSON 스키마로 응답하세요:
{
  "priority": "urgent" | "normal" | "newsletter" | "spam",
  "needs_reply": true | false,
  "reason": "한 줄 이유"
}

판단 기준:
- urgent: 24시간 내 응답 필요, 명시적 질문/요청 포함
- normal: 업무 관련이지만 즉시성 낮음
- newsletter: 마케팅/뉴스/자동발송
- spam: 명백한 스팸/피싱

JSON 외 다른 출력 금지."""


def classify_email(
    email: Email, client: Optional[anthropic.Anthropic] = None
) -> TriageResult:
    cli = client or anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    )
    user = f"발신자: {email.sender}\n제목: {email.subject}\n본문:\n{email.body[:2000]}"
    msg = cli.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in msg.content if b.type == "text")
    data = json.loads(text)
    return TriageResult(
        email_id=email.id,
        priority=Priority(data["priority"]),
        needs_reply=bool(data["needs_reply"]),
        reason=data["reason"],
    )


DRAFT_SYSTEM = """당신은 비즈니스 이메일 작성 비서입니다.
받은 메일에 대한 정중하고 간결한 답장 초안을 작성하세요.
- 한국어 비즈니스 톤 (존댓말, 격식)
- 3~6 문장
- 인사 + 본론 + 마무리 구조
- 미정 정보는 [TBD]로 표시"""


def draft_reply(email: Email, client: Optional[anthropic.Anthropic] = None) -> str:
    cli = client or anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    )
    user = f"받은 메일:\n발신자: {email.sender}\n제목: {email.subject}\n{email.body[:2000]}"
    msg = cli.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=DRAFT_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in msg.content if b.type == "text").strip()


def triage_with_reply(
    email: Email, client: Optional[anthropic.Anthropic] = None
) -> TriageResult:
    result = classify_email(email, client)
    if result.priority == Priority.URGENT and result.needs_reply:
        result.draft_reply = draft_reply(email, client)
    return result
