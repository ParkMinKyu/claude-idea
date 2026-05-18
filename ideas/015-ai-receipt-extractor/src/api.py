"""FastAPI 엔드포인트."""
import tempfile

from fastapi import FastAPI, HTTPException, UploadFile, File

from .extractor import Receipt, extract_from_image, structure_receipt, to_sheet_row

app = FastAPI(title="AI Receipt Extractor")


@app.post("/extract", response_model=Receipt)
async def extract(file: UploadFile = File(...)) -> Receipt:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "image file required")
    with tempfile.NamedTemporaryFile(
        suffix=file.filename or ".jpg", delete=False
    ) as tmp:
        tmp.write(await file.read())
        path = tmp.name
    return extract_from_image(path)


@app.post("/structure", response_model=Receipt)
def structure(payload: dict) -> Receipt:
    """이미 OCR된 텍스트를 받아 구조화 (테스트/디버그용)."""
    text = payload.get("ocr_text", "")
    return structure_receipt(text)


@app.post("/to-row")
def to_row(receipt: Receipt) -> dict:
    return {"row": to_sheet_row(receipt)}
