# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 대시보드 + 마케팅 페이지
- **Tailwind CSS + shadcn/ui**
- **Recharts**: 클릭 시계열/지역 차트

## 리다이렉트 서버
- **Next.js Edge Runtime** 또는 **Cloudflare Workers**: 글로벌 저지연 리다이렉트
- 슬러그 → 타겟 매핑은 Edge KV 캐시 + Postgres 원본

## DB
- **Postgres (Supabase)**: users, domains, links, clicks(append-only)
- **인덱스**: clicks(link_id, created_at desc)
- **파티셔닝**: clicks 테이블은 월 단위 파티션 (Phase 2)

## 분석 파이프라인
- **Edge 함수**가 클릭 이벤트를 큐(Upstash QStash)로 발행
- 워커가 IP→국가/디바이스 파싱 후 DB 적재
- 익명화: IP는 /24로 마스킹 (GDPR 대응)

## 모니터링
- **node-cron 워커**: 모든 활성 링크를 1시간마다 HEAD 요청, 4xx/5xx 발생 시 알림

## 인증/결제
- **Clerk** (인증) + **Stripe Billing** (구독)

## 배포
- **Vercel** + **Supabase** + **Cloudflare** (자체 도메인 CNAME 안내)

## 테스트
- **Vitest**: 슬러그 유효성, 클릭 집계, UTM 빌더
- **(Phase 2) Playwright**: 단축 → 클릭 → 통계 표시 E2E

## 선택 이유 요약
- 리다이렉트는 1KB 미만 응답이므로 Edge 런타임이 비용/지연 모두 최적
- Postgres는 시계열 분석 충분, 큐 분리로 spike 흡수
- Cloudflare CNAME으로 사용자 자체 도메인 매핑이 간단
