# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: 단일 페이지 분석 워크플로우
- **Tailwind + shadcn/ui**
- **recharts**: 자동 차트 렌더링

## Backend
- **Next.js Route Handlers**: SQL 생성 + 실행 endpoint
- **duckdb-async (npm)**: DuckDB 노드 바인딩 — CSV/Parquet/Postgres 모두 쿼리 가능

## LLM
- **Claude (claude-opus-4-7)**: SQL 생성은 스키마 추론 정확도 핵심
- 스키마 + 샘플 행 5개를 컨텍스트에 포함
- 출력: SQL + 차트 추천 (chart type, x/y 컬럼)

## DB
- **DuckDB**: 분석 엔진 (사용자 데이터)
- **Supabase**: 사용자/대시보드 저장 (메타데이터만)

## 보안
- SQL은 read-only 강제 (SELECT만 허용 — INSERT/UPDATE/DELETE/DROP 차단)
- 사용자 DB 연결 정보는 암호화 저장

## 배포
- **Vercel**
- DuckDB는 서버리스 함수 내 임베디드 모드

## 선택 이유 요약
- DuckDB가 CSV/Parquet 모두 처리하면서 빠름 (Postgres 대비 분석 쿼리 10배)
- Claude는 스키마 기반 SQL 생성 정확도 우수
- Next.js로 단일 코드베이스, 빠른 출시
