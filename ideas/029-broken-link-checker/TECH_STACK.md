# Tech Stack · 029 Broken Link Checker

## 크롤러
- **Node.js 20**
- **cheerio** — HTML 파싱
- **undici fetch** + **p-queue** — 동시성 제어
- **robots-parser** — robots.txt 준수
- **node-cron** — 스케줄

## 웹 대시보드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **TanStack Table** — 결과 정렬/필터

## 데이터
- **PostgreSQL (Neon)** — `sites`, `crawls`, `links`, `link_checks`
- **Drizzle ORM**
- 결과 export: CSV 스트리밍

## 인프라
- 크롤 워커: **Fly.io Machines** (리전별 IP, outbound 제한 없음)
- 대시보드: **Vercel**
- 작업 큐: **Upstash QStash**

## 알림
- **Slack/Discord webhook**
- **Resend** — 월간 리포트

## 인증·결제
- **Clerk** + **Stripe Billing**

## 테스트
- **Vitest** — 링크 추출, URL 정규화, 상태 분류, robots 평가
- Fixture HTML로 의존성 없는 단위 테스트
