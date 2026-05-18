# Tech Stack · 090 Calendar Blocker

## 프론트엔드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **react-big-calendar** — 주간 캘린더 미리보기

## 백엔드
- **Next.js Route Handlers**
- **Google Calendar API** v3 (OAuth 2.0)
- **Microsoft Graph API** — Outlook 연동
- **Zod** — 입력 검증

## 도메인 로직
- 슬롯 계산기: 근무 시간 윈도우 + 기존 이벤트를 빼서 빈 슬롯 산출
- 자동 스케줄러: 선호 시간 윈도우 가중치 기반 그리디 배치
- 침범 감지: 새 이벤트 vs 기존 블록 시간 겹침 계산

## 잡 큐
- **Inngest** — 주간 스케줄링 cron + webhook 처리

## 데이터
- **Postgres** (Neon) — `users`, `goals`, `blocks`, `audit_log`
- 캘린더 본문 미저장 (메타만 audit_log)

## 인증·결제
- **Clerk** — 이메일 + Google OAuth (캘린더 스코프 별도 동의)
- **Stripe**

## 인프라
- **Vercel** + **Neon**
- **Sentry**

## 테스트
- **Vitest** — 슬롯 계산, 충돌 감지, 스케줄러
- **Playwright** — OAuth mock + 주간 플로우

## 개발 도구
- TypeScript, pnpm, Biome
