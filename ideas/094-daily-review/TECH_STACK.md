# Tech Stack · 094 Daily Review

## 프론트엔드
- **Next.js 14 App Router** + **PWA**
- **Tailwind + shadcn/ui**
- **Recharts** — 감정 트렌드 차트

## 백엔드
- **Next.js Route Handlers**
- **Anthropic Claude API** — 프롬프트 생성, 주간 요약
  - 시스템 프롬프트는 cache_control로 캐시
- **Zod**

## 잡 스케줄러
- **Inngest** — 저녁 알림 cron, 일요일 요약 잡

## 알림 채널
- **Resend** — 이메일
- **카카오 알림톡 (BizM/카카오 비즈메시지)** — 한국 사용자
- **Web Push (Service Worker)** — PWA 푸시

## 데이터
- **Postgres** (Neon)
  - `users`, `entries(date, mood, text, tags)`, `prompts`, `summaries`
- **pgvector** — 답변 임베딩으로 유사 회고 검색

## 인증·결제
- **Clerk** — 카카오 OAuth 지원
- **Stripe** + **토스페이먼츠** (한국)

## 인프라
- **Vercel** + **Neon**
- **Sentry**

## 테스트
- **Vitest** — 프롬프트 생성, 감정 추출, 스케줄 계산
- 모의 Claude 응답으로 통합 테스트

## 개발
- TypeScript, pnpm, Biome
