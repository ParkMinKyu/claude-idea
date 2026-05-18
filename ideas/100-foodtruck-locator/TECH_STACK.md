# 기술 스택 · TruckPin

## 프론트엔드
- **Next.js 14 (App Router)** — 공개 트럭 페이지(SSR for SEO), 운영자 PWA
- **Tailwind CSS + shadcn/ui**
- **MapLibre GL JS** — 지도 (Mapbox 대안, OSS)
- **next/og** — OG 이미지 자동 생성 (인스타·카카오 공유 카드)

## 백엔드
- **Next.js Route Handlers**
  - `POST /api/trucks/:id/location` — 운영자 위치 푸시
  - `GET /api/nearby?lat=&lng=` — 반경 검색 (PostGIS or 자체 haversine)
  - `POST /api/follow/:truckId` — 손님 follow
  - `POST /api/notify/start` — 영업 시작 시 팔로워에게 푸시
- **Node.js 20 ESM**
- **Zod** — 입력 검증

## 데이터베이스
- **PostgreSQL 15 + PostGIS**
- 테이블: `trucks`, `truck_locations`(시계열), `menus`, `menu_items`, `followers`, `notifications`
- 위치 검색은 PostGIS `ST_DWithin` 또는 자체 haversine

## 푸시/알림
- **Web Push API** — PWA 푸시
- **OneSignal** — 다채널 (Push + iOS/Android)
- **Kakao Alimtalk** — 한국 단골 알림

## 인프라
- **Vercel** — Next.js
- **Neon (with PostGIS extension)** — Postgres
- **Cloudflare R2** — 메뉴 사진 저장
- **Sentry**, **PostHog**

## 결제
- **Stripe Billing** — 트럭 운영자 구독

## 개발 도구
- **TypeScript strict**
- **Vitest** — 거리 계산, 영업 상태 머신, OG 데이터 빌더 테스트
- **Playwright** — 운영자 위치 토글 → 공개 페이지 반영 E2E

## MVP 범위
이 저장소는 위치 거리 계산(haversine), 영업 상태 머신, OG 메타데이터 빌더, 팔로워 알림 대상 선정 로직을 순수 함수로 구현. 지도/DB는 외부로 격리.
