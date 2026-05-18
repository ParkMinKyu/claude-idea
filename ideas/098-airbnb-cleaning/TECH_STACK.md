# 기술 스택 · TurnoSync

## 프론트엔드
- **Next.js 14 (App Router)** — 호스트 대시보드, 청소부 모바일 페이지
- **Tailwind CSS + shadcn/ui** — 모바일 우선 청소부 UI
- **TanStack Query** — 청소 작업 상태 실시간 폴링

## 백엔드
- **Next.js Route Handlers**
  - `POST /api/properties` — 숙소 + iCal URL 등록
  - `POST /api/sync` — iCal 동기화 트리거 (cron 실행)
  - `POST /api/webhooks/twilio` — SMS 답장 수신
- **Node.js 20 ESM**
- **node-cron** — 5분마다 iCal 폴링

## iCal 파싱
- **자체 미니 파서** — RFC 5545 핵심 필드(`BEGIN:VEVENT`, `DTSTART`, `DTEND`, `UID`, `SUMMARY`)만 처리
- 외부 라이브러리(node-ical) 사용 가능하지만 의존성 최소화를 우선

## 데이터베이스
- **PostgreSQL 15 + Prisma**
- 테이블: `properties`, `reservations`, `cleanings`, `cleaners`, `dispatch_logs`
- iCal `UID`를 reservation 중복 방지 키로 사용

## SMS
- **Twilio Programmable SMS** — 글로벌
- **Solapi (한국)** — KR 번호 비용 최적화
- 라우팅: 수신자 country code에 따라 자동 선택

## 결제
- **Stripe Connect Express** — 청소부 정산
- 호스트 구독은 Stripe Billing

## 인프라
- **Vercel** — Next.js 호스팅
- **Vercel Cron / Inngest** — 정기 iCal 폴링
- **Neon** — Postgres
- **Sentry** — 오류 추적

## 개발 도구
- **TypeScript strict**
- **Vitest** — iCal 파싱, 청소 작업 생성 로직 테스트
- **Playwright** — 호스트 대시보드 E2E

## MVP 범위
이 저장소는 iCal 파싱 + 청소 작업 자동 생성 + 청소부 배정 로직을 순수 함수로 구현. Twilio·Stripe·DB는 어댑터 패턴으로 격리.
