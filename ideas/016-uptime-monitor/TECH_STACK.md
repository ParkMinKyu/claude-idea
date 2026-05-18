# Tech Stack · 016 Uptime Monitor

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 공개 상태 페이지
- **Tailwind CSS** + **shadcn/ui** — UI 컴포넌트
- **Recharts** — 응답 시간 라인 차트

## 백엔드
- **Node.js 20** — API Routes + 백그라운드 워커
- **node-cron** — 1분 단위 폴링 트리거
- **undici fetch** — HTTP 체크 (timeout, redirect 옵션 정밀 제어)
- **Zod** — 입력 검증

## 데이터
- **PostgreSQL 16** — `monitors`, `checks`, `incidents`, `subscribers` 테이블
- **Prisma ORM** — 마이그레이션 + 타입 안전 쿼리
- **Redis (Upstash)** — 워커 락 + 알림 디바운스(연속 알림 폭주 방지)

## 알림
- **Resend** — 트랜잭션 이메일
- **Slack Incoming Webhook** — 채널 알림
- **사용자 webhook** — JSON POST 페이로드

## 인프라
- **Vercel** — 프론트/엔드 + Edge API
- **Fly.io Machines** — cron 워커 (리전별 배포로 다중 리전 체크)
- **Neon** — 서버리스 Postgres
- **Sentry** — 오류 추적

## 인증·결제
- **Clerk** — 이메일·OAuth 인증
- **Stripe Billing** — 구독 + 사용량 기반 추가 모니터 과금

## 테스트
- **Vitest** — 단위 테스트 (checker, 알림 디바운스)
- **Playwright** — E2E (모니터 생성 → 상태 페이지 확인)

## 개발 도구
- pnpm workspaces, ESLint, Prettier, GitHub Actions CI
