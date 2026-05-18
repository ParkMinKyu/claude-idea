# Tech Stack · 018 Changelog Page

## 프론트엔드
- **Next.js 14 App Router** — 정적 + ISR
- **MDX (@next/mdx, remark-gfm, rehype-pretty-code)** — 본문 렌더
- **Tailwind + Typography 플러그인**
- **Shiki** — 코드 하이라이트 (빌드 타임)

## 에디터
- **Tiptap + tiptap-markdown** — WYSIWYG ↔ MDX 토글
- **uploadthing** — 이미지 업로드

## 백엔드
- **Next.js Route Handlers** — `/api/releases`, `/api/subscribe`, `/feed.xml`
- **PostgreSQL (Neon)** + **Drizzle**
- **Resend Audiences** — 구독자 + 다이제스트 발송

## 멀티 도메인
- **Vercel Domains API** — 고객 커스텀 도메인 자동 등록
- **middleware.ts** — host 기반 라우팅

## SEO
- 자동 `sitemap.xml`, `robots.txt`
- **@vercel/og** — OG 이미지 동적 생성

## 임베드 위젯
- React 마이크로 번들 (esbuild) — 8KB gzip

## 인증·결제
- **Clerk** + **Stripe Billing**

## 테스트
- **Vitest** — MDX 파서, 피드 생성기
- **Playwright** — 게시 → 공개 페이지 확인
