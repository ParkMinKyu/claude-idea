"""RAG QA 코어."""
from __future__ import annotations

import os
from typing import Optional

import anthropic
from pydantic import BaseModel

from .store import RetrievedChunk, VectorStore


class Answer(BaseModel):
    answer: str
    sources: list[str]


SYSTEM = """당신은 사내 지식 비서입니다.
주어진 문서 발췌만을 근거로 질문에 답하세요. 발췌에 없는 내용은 절대 추측하지 마세요.
답변 끝에 사용한 출처 URL을 [1], [2] 형태로 인용하세요.
정보가 부족하면 "관련 문서를 찾지 못했습니다"라고 답하세요."""


def _build_context(chunks: list[RetrievedChunk]) -> str:
    lines = []
    for i, c in enumerate(chunks, 1):
        lines.append(f"[{i}] {c.title} ({c.source})\n{c.text}")
    return "\n\n".join(lines)


def answer_question(
    question: str,
    store: VectorStore,
    client: Optional[anthropic.Anthropic] = None,
    k: int = 5,
) -> Answer:
    chunks = store.query(question, k=k)
    if not chunks:
        return Answer(answer="관련 문서를 찾지 못했습니다.", sources=[])

    cli = client or anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    )
    ctx = _build_context(chunks)
    user = f"질문: {question}\n\n관련 문서:\n{ctx}"
    msg = cli.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in msg.content if b.type == "text").strip()
    # 중복 제거하면서 순서 유지
    seen: set[str] = set()
    sources: list[str] = []
    for c in chunks:
        if c.source not in seen:
            seen.add(c.source)
            sources.append(c.source)
    return Answer(answer=text, sources=sources)
