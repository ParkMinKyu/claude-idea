# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 손님 메뉴 페이지(SSR), 식당 대시보드(CSR)
- **Tailwind CSS**: 모바일 우선 (손님은 100% 모바일 가정)
- **react-qr-code**: QR 코드 생성

## Backend
- **Next.js Route Handlers**: /api/menu, /api/orders, /api/webhook/stripe
- **Zod**: payload 검증

## DB
- **Postgres (Supabase)**: stores, menus, items, orders, order_items
- **Realtime**: Supabase Realtime — 식당 대시보드 신규 주문 push

## 결제
- **Stripe Checkout**: 카드/Apple Pay/Google Pay
- **Webhooks**: checkout.session.completed → 주문 상태 paid 전환

## 메시징
- **Twilio Programmable SMS**: 픽업 준비 완료 알림 (한국 SMS는 알림톡으로 대체 가능)

## 인증
- **Magic Link (Resend)**: 식당 점주 로그인
- 손님은 익명 — 결제 이메일/전화만 수집

## 배포
- **Vercel + Supabase**
- **환경변수**: STRIPE_*, TWILIO_*, RESEND_API_KEY

## 테스트
- **Vitest**: 주문 상태 머신, 가격/옵션 계산, SMS 템플릿
- **(Phase 2) Playwright**: 손님 주문 → 식당 완료 → SMS E2E

## 선택 이유 요약
- Supabase Realtime으로 푸시 인프라 추가 없이 식당 대시보드 실시간 갱신
- Stripe + Twilio는 단가 측면에서 가맹점 수익성 보장 (배달앱 대비)
- Next.js 단일 배포로 손님/점주 UI 모두 처리 가능
