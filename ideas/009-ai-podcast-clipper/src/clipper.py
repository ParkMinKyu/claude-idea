"""팟캐스트 → 숏폼 클립 추출 코어."""
from __future__ import annotations

import json
import os
import subprocess
from typing import Optional

import anthropic
from pydantic import BaseModel, Field


class TranscriptWord(BaseModel):
    word: str
    start: float
    end: float


class Transcript(BaseModel):
    words: list[TranscriptWord]
    full_text: str


class Clip(BaseModel):
    start: float
    end: float
    hook: str = Field(..., description="이 구간이 흥미로운 이유")
    caption: str
    hashtags: list[str]


class ClipPlan(BaseModel):
    clips: list[Clip]


SYSTEM = """당신은 숏폼 클립 큐레이터입니다.
주어진 팟캐스트 전사문에서 30~60초 길이의 바이럴 가능성 높은 구간을 5~10개 선정하세요.

선정 기준:
- 독립적으로 이해 가능 (앞 맥락 없이도 통함)
- 강한 인사이트/논쟁적 발언/유머/감정적 순간
- 한 화자가 짧고 명료하게 말한 부분 우선

응답 JSON:
{
  "clips": [
    {
      "start": 12.5,
      "end": 58.2,
      "hook": "왜 흥미로운지 한 문장",
      "caption": "SNS 캡션",
      "hashtags": ["#태그1", "#태그2"]
    }
  ]
}

JSON 외 출력 금지.
시작/종료 timestamp는 전사문 내 실제 timestamp 범위 내여야 함."""


def transcribe_audio(audio_path: str) -> Transcript:
    """faster-whisper로 전사. 테스트에서는 monkeypatch로 대체 가능."""
    from faster_whisper import WhisperModel  # 지연 import

    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio_path, word_timestamps=True, language="ko")
    words: list[TranscriptWord] = []
    text_parts: list[str] = []
    for seg in segments:
        text_parts.append(seg.text)
        for w in seg.words or []:
            words.append(TranscriptWord(word=w.word, start=w.start, end=w.end))
    return Transcript(words=words, full_text=" ".join(text_parts))


def select_clips(
    transcript: Transcript, client: Optional[anthropic.Anthropic] = None
) -> ClipPlan:
    cli = client or anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    )
    # timestamp 포함 라인 단위 전사문 생성
    lines = []
    chunk_words: list[str] = []
    chunk_start: Optional[float] = None
    for w in transcript.words:
        if chunk_start is None:
            chunk_start = w.start
        chunk_words.append(w.word)
        if w.end - chunk_start >= 5.0:  # 5초마다 줄바꿈
            lines.append(f"[{chunk_start:.1f}s] {' '.join(chunk_words)}")
            chunk_words = []
            chunk_start = None
    if chunk_words and chunk_start is not None:
        lines.append(f"[{chunk_start:.1f}s] {' '.join(chunk_words)}")

    msg = cli.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        system=SYSTEM,
        messages=[{"role": "user", "content": "\n".join(lines)}],
    )
    text = "".join(b.text for b in msg.content if b.type == "text")
    data = json.loads(text)
    return ClipPlan(**data)


def cut_clip(
    input_path: str, output_path: str, start: float, end: float
) -> None:
    """ffmpeg로 구간 자르기."""
    duration = end - start
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(start),
            "-i",
            input_path,
            "-t",
            str(duration),
            "-c",
            "copy",
            output_path,
        ],
        check=True,
        capture_output=True,
    )
