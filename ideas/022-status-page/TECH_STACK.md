# Tech Stack · 022 Status Page

## 프론트엔드
- **Next.js 14 App Router** — 공개 상태 페이지(ISR + SSE 보강)
- **Tailwind + shadcn/ui**
- **EventSource API** — SSE 수신 + 자동 재연결

## 백엔드
- **Next.js Route Handlers**
- **SSE 스트림** — `/api/sse/status` (Edge runtime, ReadableStream)
- **Upstash Redis Pub/Sub** — 인시던트 변경 fan-out
- **PostgreSQL (Neon)** — `components`, `incidents`, `incident_updates`, `subscribers`
- **Drizzle ORM**

## 알림
- **Resend** — 이메일
- **Slack incoming webhook**
- **Webhook 발송기** (재시도 큐: Upstash QStash)

## 커스텀 도메인
- Vercel Domains API + middleware

## 인증·결제
- **Clerk** + **Stripe Billing**

## 가동률 집계
- Vercel Cron 일 단위 → materialized table

## 테스트
- **Vitest** — 인시던트 상태 머신, SSE 직렬화
- **Playwright** — 인시던트 생성 → 공개 페이지 SSE 갱신
