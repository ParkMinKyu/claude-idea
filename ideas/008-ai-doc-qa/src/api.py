"""FastAPI 엔드포인트."""
from fastapi import FastAPI
from pydantic import BaseModel

from .qa import Answer, answer_question
from .store import Document, InMemoryStore

app = FastAPI(title="AI Doc QA")
_store = InMemoryStore()


class IngestBody(BaseModel):
    docs: list[Document]


class QABody(BaseModel):
    question: str
    k: int = 5


@app.post("/ingest")
def ingest(body: IngestBody) -> dict:
    for d in body.docs:
        _store.add(d)
    return {"ingested": len(body.docs)}


@app.post("/ask", response_model=Answer)
def ask(body: QABody) -> Answer:
    return answer_question(body.question, _store, k=body.k)
