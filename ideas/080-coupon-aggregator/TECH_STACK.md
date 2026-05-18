# 기술 스택

## Scraper / 백엔드
- **Node.js 20 + TypeScript**: 동시성 좋은 fetch + Cheerio로 가벼운 스크래핑
- **Cheerio / Playwright**: 정적 페이지는 Cheerio, JS 렌더링 필요 시 Playwright
- **node-cron**: 시간대별 스크래핑 스케줄 (4시간 간격)

## Frontend
- **Next.js 14 (App Router) + TypeScript**: SSR로 SEO 확보 (쿠폰 페이지는 검색 유입 핵심)
- **Tailwind CSS**: 깔끔한 카드 UI

## DB
- **Postgres (Supabase)**: stores, coupons, votes, users
- **인덱스**: store_id + success_rate desc 정렬 인덱스

## 캐싱
- **Redis (Upstash)**: 인기 쇼핑몰 페이지 5분 캐시

## 어필리에이트
- **Coupang Partners, Amazon Associates, AliExpress Portals**
- 트래킹 파라미터 자동 추가 (utm_source 등 — 본인 코드)

## 알림
- **Resend**: 이메일
- **Web Push (VAPID)**: 브라우저 푸시

## 배포
- **Vercel (Next.js)** + **Render (스크래퍼 워커)**
- 스크래퍼는 장시간 실행되므로 Vercel Functions 대신 Render Background Worker

## 테스트
- **Vitest**: 파싱 함수, 투표 집계, 어필리에이트 링크 생성
- **MSW**: 가짜 쇼핑몰 HTML 응답

## 선택 이유 요약
- 스크래핑은 Node가 풍부한 HTML 파싱 생태계 보유
- Next.js SSR은 SEO에 필수 — 자연 유입이 어필리에이트 수익의 핵심
- Supabase + Upstash로 인프라 비용을 트래픽 1만/일까지 무료 유지
