import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.extractor import (
    Category,
    LineItem,
    Receipt,
    structure_receipt,
    to_sheet_row,
)


def test_receipt_validation():
    r = Receipt(
        merchant="스타벅스",
        date="2026-05-18",
        total=5500,
        vat=500,
        items=[LineItem(name="아메리카노", quantity=1, price=5500)],
        category=Category.CAFE,
        confidence=0.9,
    )
    assert r.category == Category.CAFE
    assert r.items[0].price == 5500


def test_receipt_confidence_bounds():
    with pytest.raises(Exception):
        Receipt(
            merchant="x",
            total=100,
            items=[],
            category=Category.OTHER,
            confidence=1.5,
        )


def test_to_sheet_row_format():
    r = Receipt(
        merchant="GS25",
        date="2026-05-18",
        total=3200,
        vat=None,
        items=[
            LineItem(name="삼다수", quantity=1, price=1200),
            LineItem(name="과자", quantity=1, price=2000),
        ],
        category=Category.GROCERY,
        confidence=0.8,
    )
    row = to_sheet_row(r)
    assert row[0] == "2026-05-18"
    assert row[1] == "GS25"
    assert row[2] == "장보기"
    assert row[3] == "3200"
    assert row[4] == "0"
    assert "삼다수" in row[5]


def test_structure_receipt_parses_claude():
    fake = MagicMock()
    fake.messages.create.return_value = SimpleNamespace(
        content=[
            SimpleNamespace(
                type="text",
                text=json.dumps(
                    {
                        "merchant": "맘스터치",
                        "date": "2026-05-18",
                        "total": 8900,
                        "vat": 809,
                        "items": [
                            {"name": "싸이버거 세트", "quantity": 1, "price": 8900}
                        ],
                        "category": "식비",
                        "confidence": 0.92,
                    }
                ),
            )
        ]
    )
    receipt = structure_receipt("MOM'S TOUCH ... 8900 ... ", client=fake)
    assert receipt.merchant == "맘스터치"
    assert receipt.category == Category.FOOD
    assert receipt.total == 8900


def test_structure_receipt_rejects_empty():
    with pytest.raises(ValueError):
        structure_receipt("   ")
