# 기술 스택

## Backend
- **Python 3.11 + FastAPI**: 비동기 IO로 Gmail API 동시 호출, OAuth 콜백 처리 깔끔
- **Pydantic v2**: 분류 결과 스키마 강제
- **httpx**: 비동기 HTTP

## LLM
- **Anthropic Claude (claude-sonnet-4-6)**: 빠른 응답 + 비용 효율 — 분류는 sonnet으로 충분, 답장 초안은 opus로 업그레이드 가능
- 배치 분류로 메일 5건씩 묶어 호출 (비용 1/5)

## Gmail
- **google-api-python-client**: 공식 SDK, gmail.readonly + gmail.compose 스코프
- 토큰은 사용자별로 암호화하여 DB 저장

## DB
- **SQLite (MVP) → Postgres (Production)**: 사용자/토큰/분류 결과 캐시
- **SQLAlchemy 2.0**: async 지원, 마이그레이션은 Alembic

## Frontend
- **Next.js (별도 레포)**: 대시보드/설정만 — 핵심 가치는 백엔드에서 자동 실행
- MVP에서는 Swagger UI로 충분

## 배포
- **Fly.io 또는 Render**: 백엔드 + 백그라운드 워커 동시 운영 용이
- **APScheduler**: 주기적 메일 동기화 (5분마다)

## 선택 이유 요약
- Gmail API 공식 SDK는 Python이 가장 안정적
- FastAPI는 OAuth 콜백 + 비동기 작업에 최적
- 분류는 가벼운 모델, 답장은 강력한 모델로 비용/품질 분리
