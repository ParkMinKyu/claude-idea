# 기술 스택

## Backend
- **Python 3.11 + FastAPI**: 비동기 IO, OpenAPI 문서 자동, ML 생태계 호환
- **Pydantic**: 답변 스키마 강제

## Vector DB
- **Chroma**: 셀프호스팅 용이, 단일 노드로 수백만 청크 처리
- **Phase 2**: pgvector (Postgres에 통합) 또는 Qdrant

## 임베딩
- **OpenAI text-embedding-3-small**: 가격/성능 균형, 1536차원
- **옵션**: bge-m3 (다국어, 셀프호스팅 가능)

## LLM
- **Claude (claude-opus-4-7)**: 긴 컨텍스트 + 출처 인용 정확성
- Citations API 활용으로 출처 자동 마킹

## 커넥터
- **Notion**: notion-client (공식 SDK)
- **Google Drive**: google-api-python-client
- **PDF**: pypdf

## DB
- **Postgres**: 사용자/회사/문서 메타데이터
- **SQLAlchemy 2.0 + Alembic**

## 배포
- **Docker Compose**: Chroma + API + Postgres
- **Fly.io 또는 자체 클라우드** (보안 민감 고객은 self-hosted)

## 선택 이유 요약
- Python이 LLM/임베딩 라이브러리 가장 성숙
- Chroma는 운영 부담 가장 낮은 벡터 DB
- Claude의 long context + citations 기능이 RAG UX 차별화
