# Tech Stack · 020 Form Builder

## 빌더 UI
- **Next.js 14 App Router**
- **dnd-kit** — 드래그앤드롭
- **Tailwind + shadcn/ui**
- **Zustand** — 빌더 상태
- **react-hook-form + Zod** — 미리보기 폼 검증

## 발행 모드
- 임베드 `<iframe>` + 호스팅 페이지 + JS SDK 팝업

## 백엔드
- **Next.js Route Handlers** — `/api/forms`, `/api/submissions`
- **Prisma + PostgreSQL (Neon)**
- **uploadthing / R2** — 파일 업로드 필드

## 결제 필드
- **Toss Payments JS SDK**
- **Stripe Payment Element**
- 트랜잭션 → submission 메타로 저장

## 분기 로직 평가기
- 자체 JSON DSL → 평가 엔진(순수 함수)

## 알림
- Slack incoming webhook
- Resend 이메일

## 인증·결제
- **Clerk** + **Stripe Billing**

## 스팸 방지
- Cloudflare Turnstile
- 허니팟 필드

## 테스트
- **Vitest** — 분기 평가, 검증 규칙
- **Playwright** — 빌더 → 발행 → 응답 흐름
