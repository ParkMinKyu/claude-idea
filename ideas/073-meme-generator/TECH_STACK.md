# Tech Stack · 073 Meme Generator

## 프론트엔드
- **Next.js 14 App Router** — 생성기 + 갤러리
- **Tailwind + shadcn/ui**
- **HTML5 Canvas** — 클라이언트에서 즉시 합성 (네트워크 라운드 0회)
- **fabric.js** (옵션) — 자유 변형 모드

## AI 추천·캡션·모더레이션
- **Anthropic Claude Sonnet (vision)** — 상황 입력 + 템플릿 썸네일 → 매칭/캡션
- **Prompt cache** — 템플릿 카탈로그를 system prompt에 캐싱
- **Claude moderation** — 인물·혐오·정치 사전 차단

## 백엔드
- **Next.js Route Handlers**
- **Zod** — 입력 검증
- **node-canvas** (서버 fallback) — Open Graph 미리보기 이미지 합성

## 데이터
- **PostgreSQL 16 (Neon)** — `templates`, `memes`, `likes`, `reports`, `users`
- **Drizzle ORM**
- **pgvector** — 템플릿 임베딩 → 유사 추천
- **Redis (Upstash)** — 트렌딩 캐싱

## 저장
- **Cloudflare R2** — 사용자 생성 PNG/WebP
- **CloudFront / Cloudflare CDN** — 캐싱

## 결제·인증
- **NextAuth** (카카오 + Google)
- **토스페이먼츠** — Pro 구독

## 인프라
- **Vercel** — 웹
- **Cloudflare Workers** (옵션) — OG 이미지 사전 생성
- **Sentry**

## 테스트
- **Vitest** — 캡션 줄바꿈, 워터마크 위치 계산, 안전 필터
- **Playwright** — 텍스트 입력 → 생성 → 다운로드 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
