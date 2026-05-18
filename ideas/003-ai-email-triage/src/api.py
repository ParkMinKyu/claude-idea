"""FastAPI 엔드포인트."""
from fastapi import FastAPI, HTTPException

from .triage import Email, TriageResult, triage_with_reply

app = FastAPI(title="AI Email Triage")


@app.post("/triage", response_model=TriageResult)
def post_triage(email: Email) -> TriageResult:
    if not email.body.strip():
        raise HTTPException(400, "empty body")
    return triage_with_reply(email)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
