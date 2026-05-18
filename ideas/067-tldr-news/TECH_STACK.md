# Tech Stack · 067 TLDR News

## 수집·요약 파이프라인
- **Node.js 20** — 워커 런타임
- **node-cron** — KST 00:00, 00:30, 01:00 단계별 트리거
- **fast-xml-parser** — RSS/Atom 파싱
- **undici** — RSS fetch (timeout, ETag/If-Modified-Since)
- **@anthropic-ai/sdk** — Claude Sonnet 호출 + prompt caching
- **node-html-parser** — 본문 추출 fallback

## 데이터
- **PostgreSQL 16 (Neon)** — `feeds`, `articles`, `summaries`, `categories`, `subscribers`, `editions`
- **Drizzle ORM**
- **pgvector** — 제목/요약 임베딩 저장 → 중복 탐지
- **Redis (Upstash)** — fetch ETag 캐시, rate limit

## 프론트엔드
- **Next.js 14 App Router** — 가입/카테고리 선택 UI + 웹 아카이브
- **Tailwind CSS** + shadcn/ui
- **React Email** — 발송 이메일 템플릿

## 발송·결제·인증
- **Resend** — 트랜잭션 + 뉴스레터 발송
- **NextAuth** (이메일 매직링크)
- **Stripe / 토스페이먼츠** — 구독 결제 + 광고 인보이스

## 인프라
- **Vercel** — 웹/대시보드
- **Fly.io Machines** — cron 워커 (KST 리전)
- **Sentry** — 오류 추적

## 테스트
- **Vitest** — RSS 파서, 중복 탐지, 요약 프롬프트 빌더
- **Playwright** — 가입 → 카테고리 선택 → 첫 발송 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
