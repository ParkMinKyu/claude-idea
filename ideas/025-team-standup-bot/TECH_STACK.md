# Tech Stack · 025 Slack Standup Bot

## 봇 런타임
- **Node.js 20**
- **@slack/bolt** — 이벤트/액션/슬래시 커맨드 처리
- **express** receiver (Vercel deploy 또는 Fly Machines)

## 스케줄러
- **node-cron** — 워크스페이스별 cron 등록
- **node-schedule** — 타임존 보정
- **Redis (Upstash)** — 분산 락(중복 발송 방지)

## 데이터
- **PostgreSQL (Neon)** — `workspaces`, `standups`, `responses`, `members`
- **Prisma**

## 인증
- **Slack OAuth v2**
- 액세스 토큰 암호화 저장(AES-GCM, KMS 또는 env key)

## 외부 통합
- **Google Calendar API** — 공휴일/휴가 자동 제외
- **Zapier / n8n webhook** — 응답 데이터 export

## 결제
- **Stripe Billing** — per-seat 모델

## 분석
- 응답률, 평균 응답 시간 → Recharts 대시보드

## 테스트
- **Vitest** — 스케줄 계산, 응답 집계, 휴가 매칭
- **@slack/bolt** 테스트 헬퍼로 mocked 페이로드 처리
