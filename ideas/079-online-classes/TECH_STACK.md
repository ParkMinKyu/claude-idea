# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 강사 페이지(SSR, SEO), 예약 흐름(CSR), 대시보드(CSR) 통합
- **Tailwind CSS + shadcn/ui**: 모바일 우선 디자인
- **react-day-picker**: 캘린더 슬롯 선택 UI

## Backend
- **Next.js Route Handlers**: /api/classes, /api/slots, /api/bookings, /api/webhook/stripe
- **date-fns + date-fns-tz**: 강사/학생 타임존 변환

## 결제
- **Stripe Checkout**: 1회 결제, 환불 API
- **Stripe Webhooks**: payment_intent.succeeded → 예약 확정

## DB
- **Postgres (Supabase)**: instructors, classes, slots, bookings, refund_policies
- **Drizzle ORM**: 타입 안전 쿼리

## 알림
- **Resend**: 확인/리마인더 이메일
- **(Phase 2) Twilio / 카카오 알림톡**: SMS 리마인더

## 캘린더
- **Cron pattern → slot generator (Node)**: 강사가 "매주 화요일 19:00 60분" 등록 → 미래 8주분 슬롯 자동 생성
- **(Phase 2) Google Calendar 양방향 sync**

## 배포
- **Vercel + Supabase**
- **Cron**: Vercel Cron Functions (리마인더 발송, 슬롯 갱신)

## 테스트
- **Vitest**: 슬롯 생성 로직, 환불 정책 평가, 정원 체크
- **(Phase 2) Playwright**: 강사 등록 → 학생 예약 E2E

## 선택 이유 요약
- 예약은 시간/타임존이 핵심 → date-fns-tz로 정확성 확보
- Stripe Checkout으로 PCI 부담 제거, 환불은 즉시 처리 가능
- Vercel Cron은 무료 한도가 넉넉해 리마인더 발송에 충분
