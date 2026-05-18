import pytest
from httpx import ASGITransport, AsyncClient

from app import make_app, reset_state


@pytest.fixture
def client():
    reset_state()
    app = make_app()
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_health(client):
    async with client as c:
        r = await c.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


async def test_store_groups_same_fingerprint(client):
    stack = '  File "/app/main.py", line 1, in main\n    raise TypeError'
    async with client as c:
        r1 = await c.post("/api/p1/store/", json={"type": "TypeError", "stack": stack, "user_id": "u1"})
        r2 = await c.post("/api/p1/store/", json={"type": "TypeError", "stack": stack, "user_id": "u2"})
        issues = await c.get("/api/p1/issues/")
    assert r1.status_code == 200
    assert r2.json()["count"] == 2
    body = issues.json()
    assert len(body) == 1
    assert body[0]["affected_users"] == 2


async def test_different_errors_create_separate_issues(client):
    async with client as c:
        await c.post("/api/p1/store/", json={"type": "TypeError", "stack": ""})
        await c.post("/api/p1/store/", json={"type": "ValueError", "stack": ""})
        issues = await c.get("/api/p1/issues/")
    assert len(issues.json()) == 2
