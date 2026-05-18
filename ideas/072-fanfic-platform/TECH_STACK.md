# Tech Stack · 072 Fanfic Platform

## 프론트엔드
- **Next.js 14 App Router** — 웹 + PWA
- **Tailwind + shadcn/ui**
- **TipTap (마크다운)** — 작가 에디터, 자동 저장
- **Lexical** (옵션) — 코멘트 리치 텍스트

## 백엔드
- **Next.js Route Handlers**
- **Zod** — 입력 검증
- **remark / rehype** — 본문 마크다운 → HTML
- **DOMPurify (server-side)** — XSS 방지

## 데이터
- **PostgreSQL 16 (Neon)** — `works`, `chapters`, `tags`, `users`, `kudos`, `memberships`, `comments`
- **Drizzle ORM**
- **pg_trgm** — 한국어 부분 검색 (제목·작가명)
- **Redis (Upstash)** — 트렌딩 작품 캐싱, rate limit

## 태그·필터
- **자체 태그 사전** — 별칭(예: BTS Jimin == 박지민) 자동 정규화
- **PostgreSQL `tsvector`** — 작품 검색 인덱스
- **bitset 캐시** — 사용자 차단 태그 빠른 필터

## 결제·인증
- **NextAuth** (카카오 + Apple + Google)
- **본인 인증**: PASS / NICE 인증 → 19금 열람 가능
- **Stripe Billing** + **토스페이먼츠** — 멤버십·후원

## 인프라
- **Vercel** — 웹
- **Cloudflare R2** — 본문/표지 이미지
- **Sentry**

## 테스트
- **Vitest** — 태그 정규화, 차단 태그 필터, 워드카운트
- **Playwright** — 작가 글쓰기 → 발행 → 독자 후원 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
