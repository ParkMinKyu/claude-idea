"""영수증 OCR + 구조화 추출."""
from __future__ import annotations

import json
import os
from enum import Enum
from typing import Optional

import anthropic
from pydantic import BaseModel, Field


class Category(str, Enum):
    FOOD = "식비"
    TRANSPORT = "교통"
    SHOPPING = "쇼핑"
    GROCERY = "장보기"
    CAFE = "카페"
    ENTERTAINMENT = "여가"
    HEALTH = "의료"
    UTILITY = "공과금"
    OTHER = "기타"


class LineItem(BaseModel):
    name: str
    quantity: int = 1
    price: int


class Receipt(BaseModel):
    merchant: str
    date: Optional[str] = Field(None, description="YYYY-MM-DD 또는 null")
    total: int
    vat: Optional[int] = None
    items: list[LineItem]
    category: Category
    confidence: float = Field(..., ge=0.0, le=1.0)


SYSTEM = """당신은 영수증 정제 전문가입니다.
Tesseract OCR 결과(노이즈 포함)를 받아 구조화된 영수증 데이터로 변환합니다.

규칙:
- 가맹점, 날짜(YYYY-MM-DD), 합계 금액(원), 부가세(있으면), 항목 목록 추출
- 합계는 정수(원), 천단위 콤마 제거
- 카테고리는 가맹점/항목 기반 추론
- 추출 신뢰도(confidence) 0~1로 보고 — OCR이 흐릿/누락이면 낮게
- 알 수 없는 필드는 null

응답 JSON:
{
  "merchant": "...",
  "date": "2026-05-18" 또는 null,
  "total": 12500,
  "vat": 1136 또는 null,
  "items": [{"name":"...","quantity":1,"price":12500}],
  "category": "식비"|"교통"|"쇼핑"|"장보기"|"카페"|"여가"|"의료"|"공과금"|"기타",
  "confidence": 0.85
}

JSON 외 출력 금지."""


def ocr_image(image_path: str) -> str:
    """Tesseract로 이미지 → 텍스트. 테스트는 monkeypatch."""
    import pytesseract  # 지연 import
    from PIL import Image

    img = Image.open(image_path)
    return pytesseract.image_to_string(img, lang="kor+eng")


def structure_receipt(
    ocr_text: str, client: Optional[anthropic.Anthropic] = None
) -> Receipt:
    if not ocr_text.strip():
        raise ValueError("empty OCR text")
    cli = client or anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    )
    msg = cli.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": ocr_text}],
    )
    text = "".join(b.text for b in msg.content if b.type == "text")
    data = json.loads(text)
    return Receipt(**data)


def extract_from_image(
    image_path: str, client: Optional[anthropic.Anthropic] = None
) -> Receipt:
    text = ocr_image(image_path)
    return structure_receipt(text, client)


def to_sheet_row(r: Receipt) -> list[str]:
    """Google Sheets append용 행."""
    return [
        r.date or "",
        r.merchant,
        r.category.value,
        str(r.total),
        str(r.vat or 0),
        ", ".join(f"{i.name} x{i.quantity}" for i in r.items),
    ]
