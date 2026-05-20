# Tech Stack · 101 Webhook Tester

## 런타임/프레임워크
- **Node.js 20** — 비동기 I/O가 많은 캡처 워크로드에 적합
- **Fastify 4** — Express보다 빠른 처리량, `addContentTypeParser`로 raw body를 손쉽게 보존(서명 검증의 핵심)

## 서명 검증
- **node:crypto** — `createHmac` + `timingSafeEqual`로 타이밍 공격 방지
- 외부 의존성 없이 GitHub/Stripe/Generic 규격 구현 → 보안 감사 용이

## 데이터
- **Redis (Upstash)** — bin별 요청 버퍼링(TTL 기반 자동 만료), 무료 플랜의 24시간 보관에 적합
- **PostgreSQL 16** — Pro 이상 영구 보관, 검색/필터
- **Prisma** — 스키마 마이그레이션 + 타입 안전 쿼리

## 실시간
- **Server-Sent Events** — 캡처된 요청을 뷰어로 단방향 푸시(WebSocket보다 단순, 프록시 친화적)

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 라이브 뷰어
- **Tailwind CSS** + **shadcn/ui**
- **react-json-view** — 페이로드 트리 뷰

## 인프라
- **Fly.io** — 컨테이너 배포(셀프호스팅 이미지와 동일 Dockerfile 재사용)
- **Cloudflare** — bin 서브도메인 와일드카드 라우팅

## 인증·결제
- **Clerk** — 인증
- **Stripe Billing** — 구독

## 테스트
- **Vitest** — 서명 검증/인스펙터 단위 테스트 (오프라인 실행)
- **Fastify inject** — 라우트 통합 테스트

## 선택 이유 요약
서명 검증이 제품의 차별점이므로 검증 로직을 외부 라이브러리에 위임하지 않고 표준 crypto로 직접 구현해 투명성을 확보했다. raw body 보존이 필수라 이를 1급으로 지원하는 Fastify를 채택했다.
