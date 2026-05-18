# Tech Stack · 026 Meeting Cost Calculator

## 프론트엔드
- **Next.js 14 App Router** — 메인은 정적, 노 로그인
- **Tailwind + shadcn/ui**
- **CSS variables** — 통화 단위/색상 즉시 전환
- 카운터: `requestAnimationFrame` 기반 부드러운 업데이트

## 공유 카드
- **@vercel/og** — SVG/PNG OG 이미지 동적 생성

## 캘린더 연동(유료)
- **Google Calendar API** (OAuth)
- 이벤트 description에 자동 링크 삽입

## 데이터(유료만)
- **PostgreSQL (Neon)** — 회의 히스토리
- **Drizzle**

## 인증·결제
- **Clerk** (유료 전용)
- **Stripe Billing**

## 분석
- **Plausible** — 노 트래킹 친화
- 익명 카운터 사용 통계만 집계

## 테스트
- **Vitest** — 비용 계산, 통화 포맷, OG payload
- **Playwright** — 카운터 동작 확인
