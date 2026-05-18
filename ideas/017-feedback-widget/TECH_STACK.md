# Tech Stack · 017 Feedback Widget

## 위젯 (Client)
- **Vanilla JS (ES2020)** — 의존성 0, IIFE 번들
- **esbuild** — 12KB gzip 타깃, single-file output
- **CSS-in-JS (template literal)** — 외부 스타일 충돌 회피
- **Shadow DOM** — 호스트 페이지와 격리

## API 서버
- **Next.js 14 App Router** — `/api/v1/feedback`, `/api/v1/config`
- **Edge Runtime** — 전 세계 응답 수집 지연 최소화
- **Hono** 옵션 — 더 가벼운 라우팅이 필요할 때
- **Zod** — 페이로드 검증
- **CORS** — `*` 허용 + 워크스페이스 origin 화이트리스트

## 데이터
- **PostgreSQL (Neon)** — `feedback`, `widgets`, `workspaces`
- **Drizzle ORM**
- **S3 (Cloudflare R2)** — 스크린샷 저장

## 대시보드
- **Next.js + shadcn/ui**
- **TanStack Query**
- 칸반은 **dnd-kit**

## 인증·결제
- **Clerk** + **Stripe Billing**

## 알림
- **Slack incoming webhook**
- **Resend** 이메일 다이제스트 (일간)

## 인프라
- **Vercel** — API + 대시보드
- **Cloudflare CDN** — 위젯 정적 파일
- **Sentry**

## 테스트
- **Vitest** — 위젯 모듈 단위 테스트
- **Playwright** — 브라우저 위젯 E2E
- **k6** — API 부하 테스트
