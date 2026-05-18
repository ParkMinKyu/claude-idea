# Tech Stack · 066 Newsletter Platform

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 공개 아카이브 페이지 (ISR)
- **Tailwind CSS** + **shadcn/ui** — 빠른 UI 구축
- **TipTap (마크다운 모드)** — 작가용 에디터
- **next-mdx-remote** — 발행된 글 렌더링

## 백엔드
- **Next.js Route Handlers** — REST API
- **Zod** — 입력 검증
- **마크다운 파서(remark/rehype)** — 본문 HTML 변환 + 페이월 미리보기 잘라내기

## 데이터
- **PostgreSQL 16 (Neon)** — `newsletters`, `issues`, `subscribers`, `sends`, `paid_members`
- **Drizzle ORM** — 마이그레이션 + 타입 안전 쿼리
- **Redis (Upstash)** — rate limit, 발송 큐 락

## 이메일 발송
- **Resend** — 트랜잭션/뉴스레터 발송 (배치 API)
- **List-Unsubscribe 헤더 자동 삽입** (One-click unsubscribe RFC 8058)
- **DKIM/SPF 자동 도메인 검증** (커스텀 도메인 사용자용)

## 결제·인증
- **NextAuth** — 이메일 매직링크 + Google OAuth
- **Stripe Billing** — 글로벌 카드 결제 (구독 + Connect 정산)
- **토스페이먼츠 Billing** — 한국 카드 (선택)

## 인프라
- **Vercel** — 프론트/엔드
- **Resend (이메일)** + **Cloudflare R2** (이미지 저장)
- **GitHub Actions** — CI 테스트

## 테스트
- **Vitest** — 마크다운 페이월 자르기, 구독자 토큰 생성 단위 테스트
- **Playwright** — 가입 → 첫 이슈 발송 E2E

## 개발 도구
- pnpm, ESLint, Prettier, TypeScript strict
