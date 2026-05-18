# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 리스팅 SSR(SEO), 대시보드/예약 캘린더 CSR
- **Tailwind CSS + shadcn/ui**
- **react-day-picker**: 예약 캘린더
- **mapbox-gl 또는 react-leaflet**: 위치 기반 검색

## Backend
- **Next.js Route Handlers**
- **Postgres (Supabase)** + **PostGIS**: 위치 기반 검색
- **Drizzle ORM**

## 결제 / 정산
- **Stripe Connect (Express)**: 호스트 KYC, 자금 보관
- **PaymentIntent**: capture_method=manual로 보증금 분리 보관
- 정산: 반환 확인 후 transfer_data 적용

## 검색
- PostGIS ST_DWithin으로 반경 검색
- **(Phase 2) Algolia/Meilisearch**

## 이미지
- **Cloudflare R2**: 리스팅 사진
- **next/image + sharp**: 자동 리사이즈

## 메시징
- 사용자 간 채팅: Supabase Realtime 채널 (양방향 메시지)
- 이메일 알림: **Resend**

## 배포
- **Vercel + Supabase + Cloudflare R2**

## 테스트
- **Vitest**: 가격 계산, 캘린더 충돌 검증, 분쟁 상태 머신
- **(Phase 2) Playwright**: 호스트 등록 → 게스트 예약 → 반환 E2E

## 선택 이유 요약
- PostGIS는 무료로 위치 검색 처리 가능 → 초기 인프라 비용 절감
- Stripe Connect는 보증금 분리 + KYC + 정산을 한번에 처리 (마켓플레이스 표준)
- Supabase Realtime으로 채팅을 추가 인프라 없이 구축
