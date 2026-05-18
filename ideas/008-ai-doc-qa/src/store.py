"""Chroma 기반 청크 저장/검색."""
from __future__ import annotations

from typing import Optional, Protocol

from pydantic import BaseModel


class Document(BaseModel):
    id: str
    text: str
    source: str  # URL or path
    title: str


class RetrievedChunk(BaseModel):
    doc_id: str
    text: str
    source: str
    title: str
    score: float


def chunk_text(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    if size <= overlap:
        raise ValueError("size must be larger than overlap")
    chunks: list[str] = []
    i = 0
    while i < len(text):
        chunks.append(text[i : i + size])
        i += size - overlap
    return [c for c in chunks if c.strip()]


class VectorStore(Protocol):
    def add(self, doc: Document) -> None: ...
    def query(self, q: str, k: int = 5) -> list[RetrievedChunk]: ...


class InMemoryStore:
    """간단한 TF-IDF-like 메모리 저장소 (테스트 + MVP fallback)."""

    def __init__(self) -> None:
        self._docs: list[tuple[str, Document]] = []

    def add(self, doc: Document) -> None:
        for c in chunk_text(doc.text):
            self._docs.append((c, doc))

    def query(self, q: str, k: int = 5) -> list[RetrievedChunk]:
        q_terms = set(q.lower().split())
        scored: list[tuple[float, str, Document]] = []
        for chunk, doc in self._docs:
            chunk_terms = set(chunk.lower().split())
            overlap = len(q_terms & chunk_terms)
            if overlap > 0:
                score = overlap / max(len(q_terms), 1)
                scored.append((score, chunk, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            RetrievedChunk(
                doc_id=doc.id,
                text=chunk,
                source=doc.source,
                title=doc.title,
                score=score,
            )
            for score, chunk, doc in scored[:k]
        ]
