from types import SimpleNamespace
from unittest.mock import MagicMock

from src.qa import answer_question
from src.store import Document, InMemoryStore, chunk_text


def test_chunk_text_basic():
    out = chunk_text("abcdefghij" * 10, size=20, overlap=5)
    assert len(out) > 1
    # overlap means consecutive chunks share suffix/prefix
    assert out[0][-5:] == out[1][:5]


def test_inmemory_store_retrieval():
    store = InMemoryStore()
    store.add(
        Document(
            id="1",
            title="환급 정책",
            source="notion://a",
            text="결제 후 7일 이내 환급 가능. 환급 절차는 고객센터 문의.",
        )
    )
    store.add(
        Document(
            id="2",
            title="휴가 정책",
            source="notion://b",
            text="연차는 입사 1년 후 15일 부여.",
        )
    )
    results = store.query("환급", k=3)
    assert any(r.doc_id == "1" for r in results)


def test_answer_question_with_no_match():
    store = InMemoryStore()
    # 빈 store
    result = answer_question("무엇이든", store)
    assert result.answer.startswith("관련 문서")
    assert result.sources == []


def test_answer_question_uses_claude():
    store = InMemoryStore()
    store.add(
        Document(
            id="1",
            title="환급",
            source="notion://a",
            text="환급은 7일 이내 가능합니다.",
        )
    )
    fake = MagicMock()
    fake.messages.create.return_value = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="환급은 7일 이내 가능합니다 [1]")]
    )
    result = answer_question("환급 절차는?", store, client=fake)
    assert "7일" in result.answer
    assert "notion://a" in result.sources
    fake.messages.create.assert_called_once()
