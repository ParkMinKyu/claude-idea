# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 이벤트 페이지 SSR(SEO), 대시보드/스캐너 CSR
- **Tailwind CSS + shadcn/ui**
- **html5-qrcode**: PWA 카메라 기반 QR 스캐너

## 백엔드
- **Next.js Route Handlers**: 결제/티켓/스캔 API
- **qrcode npm**: QR 이미지 생성 (PNG/SVG, 이메일 첨부)
- **jose**: JWT 서명 — QR payload는 JWT(EdDSA)로 위변조 방지

## DB
- **Postgres (Supabase)**: organizers, events, ticket_types, tickets, scan_log
- **유니크 인덱스**: tickets(ticket_id) — 중복 입장 방지의 핵심

## 결제
- **Stripe Checkout**: 카드/Apple Pay/Google Pay
- **Webhooks**: payment_intent.succeeded → ticket 발급 트랜잭션

## 이메일
- **Resend**: 결제 완료 + QR 첨부 (multipart)

## 인증
- **Clerk** 또는 **Supabase Auth**: 주최자 로그인
- 참가자는 익명, 결제 이메일 기반 티켓

## 배포
- **Vercel + Supabase**
- **환경변수**: STRIPE_*, RESEND_API_KEY, QR_JWT_PRIVATE_KEY, QR_JWT_PUBLIC_KEY

## 테스트
- **Vitest**: JWT 발급/검증, 가격 계산, 중복 스캔 거부
- **(Phase 2) Playwright**: 결제 → QR 이메일 → 스캔 E2E

## 선택 이유 요약
- QR 위변조 방지에 JWT(EdDSA)는 가볍고 표준적
- Supabase 유니크 인덱스로 race condition 방지(이중 스캔 차단)
- Resend + 첨부로 발권 흐름이 단일 트랜잭션화
