# Tech Stack · 028 Domain Watcher

## CLI / Worker
- **Node.js 20** + **commander** — `domwatch` CLI
- **whois** npm 패키지 — TCP 43 raw whois
- **node-cron** — 폴링 스케줄
- **lowdb / SQLite** — 로컬 캐시 (CLI 단독 모드)

## SaaS 백엔드
- **Next.js 14 App Router**
- **PostgreSQL (Neon)**
- **Drizzle ORM**
- **Vercel Cron + Fly.io Machines** — whois 폴링 (Vercel은 outbound TCP 43 제한 → Fly.io에서 실행)

## 알림
- **Resend** — 이메일
- **Slack/Discord webhook**
- **Telegram Bot API**

## 인증·결제
- **Clerk** + **Stripe Billing**

## CLI 인증
- 사용자 API 키 헤더 (`DOMWATCH_API_KEY` env)

## 테스트
- **Vitest** — whois 파서, 만료 알림 단계 결정, 도메인 검증
- 모의 whois 응답 fixture
