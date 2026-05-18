# 기술 스택

## Frontend (PWA)
- **Next.js 14 + TypeScript**: SSR 마케팅 페이지 + PWA 설정
- **Service Worker + Web Push API (VAPID)**: 브라우저 푸시
- **Tailwind CSS**: 빠른 UI

## Backend / 워커
- **Node.js 20 + TypeScript**
- **Cheerio + undici(fetch)**: 정적 페이지 크롤링
- **node-cron** 또는 **BullMQ**: 5분/1분 간격 작업 스케줄

## DB / 캐시
- **Postgres (Supabase)**: users, subscriptions, sales, devices(push tokens)
- **Redis (Upstash)**: 직전 크롤링 결과 캐시(중복 제거)

## 푸시 인프라
- **web-push (npm)**: VAPID 서명, 브라우저별 endpoint 전송
- **Resend**: 이메일 백업 채널
- **(Phase 2) Telegram Bot API**

## 매칭 엔진
- 신규 sale → 사용자 구독(브랜드/카테고리/최소 할인율) 인덱스 매칭
- 시간대 필터(예: 23:00~07:00 침묵) 적용

## 배포
- **Vercel (Next.js)** + **Fly.io 또는 Render (워커)**
- 워커는 항상 동작해야 하므로 background process 호스팅 필요

## 테스트
- **Vitest**: 매칭 로직, 알림 throttling, sale 파서
- **MSW**: 모의 쇼핑몰 응답

## 선택 이유 요약
- Web Push는 모바일 앱 없이도 푸시를 가능케 함 → 마찰 최소화
- 5분 간격 크롤링은 BullMQ로 재시도/우선순위 제어가 깔끔
- VAPID 키 관리만 잘 하면 푸시 인프라 추가 비용 거의 없음
