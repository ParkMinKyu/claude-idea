# 기술 스택 · SaunaDispatch

## 프론트엔드
- **Next.js 14 (App Router)** — 매장 직원이 태블릿으로 쓰는 SSR 친화 UI, PWA 설정으로 오프라인 캐시 일부 지원
- **Tailwind CSS** — 락커 그리드의 색상 상태 표현이 직관적
- **TanStack Query** — 락커 상태 폴링(2초 간격) 및 옵티미스틱 업데이트
- **shadcn/ui** — 다이얼로그, 토스트, 폼 컴포넌트

## 백엔드
- **Next.js Route Handlers** — `/api/lockers`, `/api/rentals`, `/api/checkins`
- **Node.js 20** — `type: module` ESM
- **Zod** — 입력 검증 (락커 ID, 회원 ID, 권종 차감 수량 등)

## 데이터베이스
- **PostgreSQL 15** — 트랜잭션 정합성 (락커 배정과 권종 차감을 한 트랜잭션으로 묶음)
- **Prisma ORM** — 스키마 마이그레이션, 타입 안전 쿼리
- 주요 테이블: `members`, `lockers`, `rentals`, `passes`, `checkins`, `staff_shifts`

## 인증/멀티테넌시
- **NextAuth (Credentials + Magic Link)** — 직원 로그인
- 매장 단위 `workspace_id` 컬럼으로 RLS 흉내 (Postgres Row Security 옵션)

## 인프라
- **Vercel** — Next.js 호스팅
- **Supabase Postgres / Neon** — Managed DB
- **Cloudflare R2** — 회원 사진/서명 이미지 저장
- **Sentry** — 오류 추적
- **Resend** — 미반납 알림 이메일

## 결제 (정기 구독)
- **Toss Payments 정기결제** — 한국 매장 대상 KRW 정기결제
- Stripe Billing 백업 (글로벌 매장)

## 개발 도구
- **TypeScript strict mode**
- **Vitest** — 도메인 로직 단위 테스트(락커 상태머신, 권종 차감 계산)
- **Playwright** — 데스크 흐름 E2E
- **pnpm + turborepo** — 추후 모바일(Expo) 추가 시 대비

## 모니터링/관측
- **Vercel Analytics** — 페이지 응답 시간
- **Logtail** — 구조화 로그
- **Better Stack Status** — 매장 대상 가동률 페이지

## MVP 범위
이 저장소는 핵심 도메인(락커 상태 전이, 대여 추적, 권종 차감)을 순수 함수로 구현하여 DB·UI 없이도 테스트 가능하게 한다. Next.js Route Handler는 이 도메인 함수를 얇게 감싸는 형태로 추가될 예정이다.
