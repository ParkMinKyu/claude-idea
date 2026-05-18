# Tech Stack · 021 Waitlist SaaS

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 호스팅 가입 페이지
- **Tailwind + shadcn/ui**
- **Framer Motion** — 순번 상승 애니메이션
- **Recharts** — 일일 가입 추이

## 임베드 폼
- Vanilla JS 8KB
- iframe + script 두 가지 모드

## 백엔드
- **Next.js Route Handlers** — `/api/signup`, `/api/referral/:code`
- **PostgreSQL (Neon)** — `entries(rank, ref_code, referred_by, email, created_at, status)`
- 추천 카운트는 트리거 함수로 즉시 갱신, rank는 materialized view

## 이메일
- **Resend** — 가입 확인, 순번 알림, 초대장
- **React Email** 템플릿

## 분석
- UTM 파라미터 → entry 메타로 저장
- 추천 트리 시각화: D3 force layout

## 인증·결제
- **Clerk** + **Stripe Billing**

## 봇 차단
- **Cloudflare Turnstile**
- 이메일 도메인 블록리스트 (디스포저블)

## 테스트
- **Vitest** — 추천 코드 생성, 순번 계산
- **Playwright** — 가입 → 추천 링크 공유 흐름
