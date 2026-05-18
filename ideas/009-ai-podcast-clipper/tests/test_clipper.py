import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.clipper import (
    Clip,
    ClipPlan,
    Transcript,
    TranscriptWord,
    select_clips,
)


def _make_transcript(n: int = 30) -> Transcript:
    words = [
        TranscriptWord(word=f"word{i}", start=float(i), end=float(i + 0.5))
        for i in range(n)
    ]
    return Transcript(words=words, full_text=" ".join(w.word for w in words))


def test_clip_validation():
    c = Clip(
        start=10.0, end=60.0, hook="흥미로운 인사이트", caption="이거 봐", hashtags=["#팟캐스트"]
    )
    assert c.end > c.start


def test_clip_plan_serializable():
    plan = ClipPlan(
        clips=[
            Clip(
                start=0, end=30, hook="hook1", caption="c1", hashtags=["#a"]
            )
        ]
    )
    j = plan.model_dump_json()
    assert "hook1" in j


def test_select_clips_parses_response():
    fake = MagicMock()
    fake.messages.create.return_value = SimpleNamespace(
        content=[
            SimpleNamespace(
                type="text",
                text=json.dumps(
                    {
                        "clips": [
                            {
                                "start": 5.0,
                                "end": 50.0,
                                "hook": "강한 의견",
                                "caption": "이걸 들어봐",
                                "hashtags": ["#인사이트", "#팟캐스트"],
                            }
                        ]
                    }
                ),
            )
        ]
    )
    plan = select_clips(_make_transcript(), client=fake)
    assert len(plan.clips) == 1
    assert plan.clips[0].hook == "강한 의견"
    fake.messages.create.assert_called_once()


def test_select_clips_rejects_invalid_json():
    fake = MagicMock()
    fake.messages.create.return_value = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="not json")]
    )
    with pytest.raises(json.JSONDecodeError):
        select_clips(_make_transcript(), client=fake)
