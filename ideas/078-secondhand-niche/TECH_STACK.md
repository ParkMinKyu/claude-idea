# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 리스팅 SSR(SEO), 검색/필터 CSR
- **Tailwind CSS + shadcn/ui**: 모바일 우선 UI
- **react-image-gallery**: 카메라/렌즈 사진 다중 캐러셀

## Backend
- **Next.js Route Handlers**: REST 엔드포인트
- **Postgres (Supabase)**: 사용자, 리스팅, 거래, 분쟁
- **Drizzle ORM**: 타입 안전 쿼리

## 결제 (에스크로)
- **Stripe Connect (Express)**: 셀러 KYC 자동, 플랫폼이 자금 보관 후 정산
- **Stripe Payment Intents**: capture_method=manual로 7일 검수 후 capture
- 분쟁 시 자동 환불 (refund API)

## 검색
- **Postgres FTS (MVP)** → **Meilisearch (Phase 2)**
- 모델 DB는 별도 시드 테이블 (camera_models)

## 이미지
- **Cloudflare R2 (또는 S3)**: 리스팅 이미지
- **next/image + sharp**: 자동 리사이즈

## 인증
- **Clerk** 또는 **NextAuth + Phone OTP**: 한국 사용자 대상 휴대폰 인증 필수

## 배포
- **Vercel + Supabase**: 단일 PaaS 스택

## 테스트
- **Vitest**: 수수료/정산 계산, 분쟁 상태 머신
- **Playwright (Phase 2)**: 리스팅 → 결제 E2E

## 선택 이유 요약
- Stripe Connect는 에스크로 + KYC + 정산을 한 번에 해결 — 마켓플레이스 최적
- Supabase는 인증/DB/스토리지를 한 번에 제공해 초기 인프라 비용 절감
- 카메라 시세는 정형 데이터이므로 모델 DB 시딩이 검색 품질을 좌우 → Postgres 충분
