# Tech Stack · 069 Short Video CMS

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 임베드 가능한 피드 페이지
- **Tailwind + shadcn/ui**
- **Swiper.js (vertical mode)** — 풀스크린 세로 피드
- **HLS.js** — Safari 외 브라우저에서 HLS 재생
- **Embla Carousel** — 데스크톱 그리드

## 비디오 인프라
- **Mux Video** (primary) — direct upload, 트랜스코딩, HLS, signed playback URL
- **Cloudflare Stream** (대안) — 한국 리전 latency 우위 시
- **IMA SDK** — pre/mid/post-roll 광고 (옵션)

## 백엔드
- **Next.js Route Handlers**
- **Webhook receiver** — Mux `video.asset.ready`, `video.asset.errored`
- **Zod** — payload 검증, **signed webhook secret 검증**
- **JWT** — signed playback URL 발급 (Mux signing key)

## 데이터
- **PostgreSQL 16 (Neon)** — `assets`, `playbacks`, `views`, `ad_slots`
- **Drizzle ORM**
- **ClickHouse / Tinybird** — 시청 이벤트(0/25/50/75/100% 도달) 집계

## 분석
- **자체 beacon** (`/api/v/heartbeat`) — 5초마다 진행률 ping
- **Mux Data SDK** (옵션) — QoE/스타트업 시간 측정

## 결제·인증
- **NextAuth** (이메일 + Google)
- **Stripe Billing** — 트랜스코딩 분 사용량 기반

## 인프라
- **Vercel** — 웹/대시보드
- **Mux / Cloudflare R2** — 비디오 저장 + CDN

## 테스트
- **Vitest** — Mux 웹훅 서명 검증, 시청률 곡선 계산
- **Playwright** — 업로드 → 피드 노출 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
