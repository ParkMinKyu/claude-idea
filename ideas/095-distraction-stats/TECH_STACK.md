# Tech Stack · 095 Distraction Stats

## 에이전트
- **Electron 30** (또는 089 통합) — 이벤트 수집기
- 로컬 큐 → Pro면 서버 sync, 무료는 로컬 SQLite

## 프론트엔드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **Recharts** — 스택드 바, 라인 차트
- **react-pdf** — 주간 리포트 PDF 생성

## 백엔드
- **Next.js Route Handlers**
- **Zod** — 이벤트 스키마
- **Postgres** (Neon) — 이벤트 적재
  - 일별 집계 매테리얼라이즈드 뷰

## 도메인 로직
- 집중 점수 계산: 가중치 적용 카테고리 비율
- 시간대별 분포: 30분 버킷
- 차단 통계: focus-blocker 이벤트와 조인

## 잡 큐
- **Inngest** — 일요일 23시 PDF 생성 + 이메일 발송

## 알림
- **Resend** — 이메일 + PDF 첨부
- **Slack** — 일일 요약 (Pro)

## 인증·결제
- **Clerk Organizations** (Team)
- **Stripe**

## 인프라
- **Vercel** + **Neon**
- **R2** — PDF 보관

## 테스트
- **Vitest** — 집중 점수, 버킷 집계, PDF 데이터 준비
- 통합: 가짜 이벤트로 주간 리포트 생성

## 개발
- TypeScript, pnpm, Biome
