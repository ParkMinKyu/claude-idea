# Tech Stack · 019 Link in Bio

## 프론트엔드
- **Next.js 14 App Router** — 공개 페이지는 정적/ISR
- **Tailwind CSS** + **shadcn/ui**
- **dnd-kit** — 링크 드래그 정렬
- **Framer Motion** — 테마 전환 애니메이션

## 백엔드
- **Next.js Route Handlers** — `/api/links`, `/api/track`
- **Prisma ORM**
- **PostgreSQL (Neon)**

## 분석
- 클라이언트 sendBeacon → `/api/track` → Postgres
- 일 단위 집계는 **Vercel Cron**으로 materialized table 갱신

## 결제 카드
- **Stripe Payment Links**
- **Toss Payments** (서버리스 함수로 결제창 호출)
- **Lemon Squeezy**

## 커스텀 도메인
- **Vercel Domains API** + middleware host routing

## 인증
- **Clerk** (이메일 + OAuth 카카오/구글)

## 결제 구독
- **Stripe Billing**

## 테스트
- **Vitest** — 링크 정렬, 트래킹 정규화
- **Playwright** — 페이지 빌더 → 공개 페이지 클릭 흐름
