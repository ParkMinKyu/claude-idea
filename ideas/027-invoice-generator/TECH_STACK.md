# Tech Stack · 027 Invoice Generator

## 프론트엔드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **react-pdf** 또는 **@react-pdf/renderer** — 인보이스 PDF 미리보기/생성

## 백엔드
- **Next.js Route Handlers**
- **PDF 서버 생성**: `@react-pdf/renderer` server runtime
- **PostgreSQL (Neon)** — `clients`, `invoices`, `line_items`, `payments`
- **Prisma**

## 이메일
- **Resend** — PDF 첨부 발송
- **React Email** 템플릿

## 결제
- **Toss Payments** (국내)
- **Stripe** (해외)
- 웹훅 → 결제 상태 동기화

## 환율
- **exchangerate.host** API (캐시 1시간)

## 인증·결제
- **Clerk** + **Stripe Billing**

## 테스트
- **Vitest** — 합계 계산, 세금, 통화 변환, 인보이스 번호 생성
- **Playwright** — 인보이스 생성 → 발송 → 결제 시뮬레이션
