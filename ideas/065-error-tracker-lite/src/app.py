"""FastAPI surface for ingesting Sentry-compatible events."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .fingerprint import fingerprint


class EventIn(BaseModel):
    type: str = Field(..., description="exception type, e.g. TypeError")
    message: str = ""
    stack: str = ""
    release: str | None = None
    user_id: str | None = None


class IssueState(BaseModel):
    fingerprint: str
    type: str
    message: str
    count: int = 0
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    affected_users: int = 0


_issues: dict[str, IssueState] = {}
_users_per_fp: dict[str, set[str]] = {}


def reset_state() -> None:
    _issues.clear()
    _users_per_fp.clear()


def make_app() -> FastAPI:
    app = FastAPI(title="error-tracker-lite")

    @app.get("/health")
    async def health() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/{project_id}/store/")
    async def store(project_id: str, event: EventIn) -> dict[str, Any]:
        if not project_id:
            raise HTTPException(status_code=400, detail="project required")
        fp = fingerprint(event.type, event.stack)
        now = datetime.utcnow()
        issue = _issues.get(fp) or IssueState(
            fingerprint=fp, type=event.type, message=event.message, first_seen=now
        )
        issue.count += 1
        issue.last_seen = now
        if event.user_id:
            users = _users_per_fp.setdefault(fp, set())
            users.add(event.user_id)
            issue.affected_users = len(users)
        _issues[fp] = issue
        return {"id": fp, "count": issue.count}

    @app.get("/api/{project_id}/issues/")
    async def list_issues(project_id: str) -> list[IssueState]:
        return sorted(_issues.values(), key=lambda i: i.count, reverse=True)

    return app


app = make_app()
