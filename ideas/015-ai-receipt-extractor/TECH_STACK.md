# 기술 스택

## Backend
- **Python 3.11 + FastAPI**: OCR/이미지 처리 생태계 강력
- **Pydantic**: 추출 결과 스키마

## OCR
- **pytesseract (Tesseract 5)**: 한국어 + 영문 동시 인식, 무료/오픈소스
- **Pillow**: 전처리 (회전 보정, 이진화)
- **opencv-python**: 영수증 경계 자동 감지 (옵션)

## LLM
- **Claude (claude-sonnet-4-6)**: OCR 결과 구조화는 비싼 모델 불필요, sonnet으로 충분
- 카테고리 분류 + 부가세 계산 동시 처리

## Storage
- **Postgres**: 거래 내역, 사용자, 연동 토큰
- **S3 호환**: 영수증 이미지 (Pro는 보관, Free는 처리 후 삭제)

## 연동
- **Google Sheets API**: 가장 보편적
- **Notion API**: 한국 사용자 선호도 높음
- **(향후) 뱅크샐러드 API**

## 배포
- **Fly.io / Render**: FastAPI + Tesseract 동일 컨테이너
- **Docker**: Tesseract 설치 단순화

## 선택 이유 요약
- Tesseract는 한국어 OCR 무료 옵션 중 최선 (Google Vision API 대비 비용 1/10)
- Claude sonnet으로 OCR 노이즈 정제 → 정확도 추가 상승
- Python이 OCR 처리에 가장 안정적
