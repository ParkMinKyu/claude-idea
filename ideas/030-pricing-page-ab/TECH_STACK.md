# Tech Stack · 030 Pricing Page A/B Test

## 프론트엔드 & 분기
- **Next.js 14 App Router**
- **middleware.ts (Edge Runtime)** — 사용자 segment 평가 + 배리언트 할당
- **Set-Cookie**로 sticky assignment
- **Tailwind + shadcn/ui**

## 이벤트 트래킹
- **Edge API** `/api/event` → **ClickHouse Cloud** 또는 **Tinybird**
- sendBeacon으로 비동기 전송

## 통계
- **frequentist**: z-test for two proportions
- **bayesian**: Beta-Bernoulli posterior, P(B > A) 계산
- 백엔드 워커 (Node) 야간 집계

## 데이터
- **PostgreSQL (Neon)** — 실험 정의, 사용자 segment
- **ClickHouse** — 이벤트 시계열

## 가격 페이지 빌더
- JSON 스키마 + shadcn 폼

## 인증·결제
- **Clerk** + **Stripe Billing**

## 결제 funnel 연동
- **Stripe webhook** + **Toss webhook** → 실험 conversion 이벤트

## 테스트
- **Vitest** — 배리언트 할당(해시 분포), 통계 계산, 자동 정지
- **Playwright** — 분기 페이지 노출 확인
