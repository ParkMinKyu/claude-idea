# 기술 스택

## Backend
- **Node.js 20 + TypeScript**: Printful REST API와의 통합 처리, 비동기 작업 큐 관리에 적합
- **Express (또는 Fastify)**: 단순한 REST 엔드포인트 — 업로드/프리셋/publish 3개 핵심 라우트

## 외부 API
- **Printful API v2**: 카탈로그 조회, mockup 생성, sync product 등록
- **(Phase 2) Shopify Admin API, Etsy Open API**: 멀티채널 동기화

## 스토리지
- **MVP**: 로컬 파일 + JSON 메타 (디자인 → 생성된 SKU 매핑)
- **Phase 2**: S3 (디자인 원본) + Postgres (사용자, 디자인, 등록 이력)

## 작업 큐
- **MVP**: 인메모리 Promise.all, 동시성 제한
- **Phase 2**: BullMQ + Redis — Printful API rate limit 흡수

## 인증/결제
- **Phase 2**: Clerk (인증) + Stripe Billing (구독)

## 배포
- **Render 또는 Railway**: Node 백엔드 단일 컨테이너
- **환경변수**: PRINTFUL_API_KEY, STRIPE_SECRET_KEY, S3_* (Vercel/Render secret)

## 테스트
- **Vitest**: 단위 테스트 (프리셋 → SKU 변환, 마진 계산)
- **MSW**: Printful API 모킹

## 선택 이유 요약
- POD 업체 통합은 LLM이 아닌 안정적 REST 클라이언트가 핵심 → Node + TS가 최적
- 디자인 자체는 작아도 mockup 생성은 비동기 큐가 필요해 일찍부터 워커 분리 가능
- Phase 1은 단일 Printful 통합만으로도 가치 검증 충분 → 멀티채널은 사용자 요청 기반 확장
