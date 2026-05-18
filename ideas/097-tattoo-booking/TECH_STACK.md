# 기술 스택 · InkSlot

## 프론트엔드
- **Next.js 14 (App Router)** — 작가별 공개 페이지 SSR + 빠른 SEO
- **Tailwind CSS + shadcn/ui** — 갤러리·캘린더 UI
- **react-day-picker** — 슬롯 선택 캘린더
- **uploadthing / Cloudflare R2 presigned URL** — 시안 이미지 업로드

## 백엔드
- **Next.js Route Handlers**
  - `POST /api/bookings/quote` — 슬롯 가용성과 예약금 계산
  - `POST /api/bookings/checkout` — Stripe Checkout 세션 생성
  - `POST /api/webhooks/stripe` — 결제 성공 시 슬롯 확정
- **Node.js 20 ESM**
- **Zod** — 입력 검증

## 데이터베이스
- **PostgreSQL 15 + Prisma**
- 주요 테이블: `artists`, `slots`, `bookings`, `payments`, `cancellation_policies`
- 슬롯 잠금은 `bookings` row의 `status = 'pending_payment'` 으로 표현, 결제 webhook에서 `confirmed` 로 전환

## 결제
- **Stripe Checkout** — 예약금 결제
- **Stripe Connect (Express)** — 작가별 정산
- **Stripe Webhooks** — `checkout.session.completed`, `charge.refunded`
- 캔슬 정책에 따라 자동 환불 (`stripe.refunds.create`)

## 알림
- **Resend** — 예약 확정/리마인더 이메일
- **Twilio** — SMS 리마인더 (미국)
- **Kakao Alimtalk** — 한국 비즈니스 채널 알림

## 캘린더 동기화
- **iCalendar (.ics) export** — 작가가 본인 캘린더에 구독
- 추후 Google Calendar OAuth 양방향 동기화

## 인프라
- **Vercel** — Next.js
- **Neon / Supabase** — Postgres
- **Upstash Redis** — 슬롯 잠금 임시 락 (결제 진행 중 동시성 방지)
- **Sentry**, **PostHog** — 오류와 퍼널 분석

## 개발 도구
- **TypeScript strict**
- **Vitest** — 가용성·환불 정책 로직 단위 테스트
- **Playwright** — Stripe test mode 기반 E2E

## MVP 범위
이 저장소는 슬롯 검색, 예약금 계산, 캔슬 환불 비율 계산 등 비즈니스 로직을 순수 함수로 구현한다. Stripe API와 DB는 인터페이스로 격리해 테스트 가능하게 한다.
