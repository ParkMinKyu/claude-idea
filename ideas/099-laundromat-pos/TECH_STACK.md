# 기술 스택 · WashKey

## 프론트엔드
- **Next.js 14 (App Router)** — 손님용 QR 결제 페이지(SSR), 사장 대시보드(CSR)
- **Tailwind CSS + shadcn/ui**
- **qrcode (npm)** — 사장이 신규 기계 등록 시 QR PNG 생성

## 백엔드
- **Next.js Route Handlers**
  - `GET /m/:machineId` — QR 진입 페이지 (가격, 잔여 시간)
  - `POST /api/checkout` — Stripe Checkout 세션 생성
  - `POST /api/webhooks/stripe` — 결제 성공 시 unlock 트리거
  - `POST /api/reservations` — 슬롯 예약 잠금
- **Node.js 20 ESM**
- **Zod** — 입력 검증

## 결제
- **Stripe Checkout (Payment Element)** — Apple Pay, Google Pay 자동
- **Stripe Terminal** — 매장 카드 단말기 옵션
- **Toss Payments** — 한국 카드 + 카카오페이/네이버페이

## 기계 제어
- **MQTT (HiveMQ Cloud)** — IoT 게이트웨이 명령 채널
- **HTTP webhook** — 게이트웨이가 없는 매장은 사장이 직접 unlock URL 등록
- **Adapter pattern** — `machine.unlock()`을 인터페이스로 추상화

## 데이터베이스
- **PostgreSQL 15 + Prisma**
- 테이블: `merchants`, `stores`, `machines`, `transactions`, `reservations`, `incidents`

## 인프라
- **Vercel** — Next.js
- **Neon** — Postgres
- **Upstash Redis** — 슬롯 예약 TTL 락 (5분 자동 해제)
- **Sentry**, **PostHog**

## 알림
- **Resend** — 매출 일일 리포트 이메일
- **Solapi** — 한국 매장 SMS 고장 알림
- **Twilio** — 미국 매장

## 개발 도구
- **TypeScript strict**
- **Vitest** — 가격 계산, 예약 만료, unlock 흐름 테스트
- **Playwright** — 결제 → unlock 시뮬레이션 E2E

## MVP 범위
이 저장소는 가격 계산, 예약 락 TTL, 결제 → unlock 트랜잭션 도메인을 순수 함수로 구현. Stripe와 MQTT는 인터페이스로 격리해 in-memory 어댑터로 테스트.
