# Tech Stack · 070 Comic Reader

## 프론트엔드
- **Next.js 14 App Router** — 웹 + PWA (모바일 우선)
- **Tailwind + shadcn/ui**
- **TanStack Query** — 사용자 라이브러리 캐싱
- **Embla Carousel** — 회차 카드 슬라이드

## 백엔드
- **Next.js Route Handlers**
- **Zod** — DTO 검증
- **TRPC** (옵션) — 클라/서버 타입 공유

## 데이터
- **PostgreSQL 16 (Neon)** — `works`, `authors`, `chapters`, `users`, `bookmarks`, `ratings`, `memberships`
- **Drizzle ORM**
- **pgvector** — 작품 임베딩 (장르·태그 텍스트 기반)
- **Redis (Upstash)** — 추천 결과 캐싱

## 추천 엔진
- **Sentence-Transformers (한국어)** — 작품 설명 임베딩 사전 계산
- **콘텐츠 기반** — 코사인 유사도 (작품 ↔ 사용자 평점 가중 평균)
- **협업 필터링** — 야간 배치로 사용자-작품 행렬 분해 (implicit ALS)

## 결제·인증
- **NextAuth** (카카오·구글·네이버 OAuth)
- **Stripe Billing** — 글로벌
- **토스페이먼츠** — 한국 카드 + 인디 작가 정산
- **PortOne(아임포트)** — 토스 미지원 PG 보조

## 인프라
- **Vercel** — 프론트/엔드
- **Cloudflare R2** — 작가 미공개 회차 이미지 (서명 URL)
- **GitHub Actions** — CI

## 테스트
- **Vitest** — 추천 점수, 어필리에이트 링크 빌더
- **Playwright** — 가입 → 추천 → 외부 클릭 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, Prettier
