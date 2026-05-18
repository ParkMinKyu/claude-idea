# Tech Stack · 024 Survey Incentive Platform

## 프론트엔드
- **Next.js 14 App Router** — 리서처 대시보드 + 응답자 모바일 UI
- **Tailwind + shadcn/ui**
- **PWA** — 응답자 앱처럼 동작

## 백엔드
- **Next.js Route Handlers**
- **PostgreSQL (Neon)** + **Drizzle**
- 트랜잭션 격리 RR — 보상 풀 잔액 동시 차감 안전

## 결제 / 송금
- **Stripe** — 리서처 결제 (Korea PG 통해 카드/계좌이체)
- **Toss Payments 송금 API** — 응답자 계좌 자동 송금
- **카카오톡 기프티콘 API** — 소액 옵션

## 본인 인증
- **PASS / NICE 본인인증 API** (한국)
- 휴대폰 번호 해시로 중복 응답 차단

## 품질 점수
- 자체 휴리스틱: 응답 시간 분포, 직진형 응답(straightlining) 감지
- 의심 응답은 수동 검토 큐

## 인증
- **Clerk** (리서처)
- 응답자: 휴대폰 매직링크 + 본인인증

## 분석
- Recharts, Polars(Python 워커)

## 테스트
- **Vitest** — 보상 풀 차감, 품질 점수, 송금 라우팅
- **Playwright** — 응답 → 보상 수령 시나리오
