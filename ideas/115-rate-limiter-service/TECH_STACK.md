# 기술 스택 · 115 API 레이트 리밋 서비스

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (`node:http` 내장 서버)

## 코어 설계
- 클럭 주입(injectable clock) 기반 순수 설계 모듈(`src/lib/limiter.ts`).
  - `TokenBucketLimiter` — capacity/refillPerSec, `consume(key,cost)`, 시간 비례 리필.
  - `SlidingWindowLimiter` — 타임스탬프 로그 + 윈도우 경계 프루닝.
  - 두 클래스 모두 `LimitResult`(allowed/remaining/limit/retryAfterMs) 공통 반환.
- `now()`를 주입받아 테스트에서 시간을 결정론적으로 제어.

## 게이트웨이
- `src/server.ts` — `createServer`로 요청 IP 키별 토큰 버킷 적용.
- `X-RateLimit-Limit/Remaining`, 429 시 `Retry-After` 헤더 설정.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/limiter.test.ts` — 가짜 클럭으로 리필/윈도우 만료/키 격리/재시도 시간 검증.
- 시간 의존 로직을 네트워크 없이 결정론적으로 테스트.

## 빌드 / 배포
- npm 라이브러리(미들웨어 어댑터) + 독립 게이트웨이 바이너리.
- Pro: 인메모리 백엔드를 Redis 백엔드로 교체하는 어댑터 인터페이스.

## 향후 확장
- Redis/Upstash 분산 백엔드 어댑터.
- 정책 DSL(엔드포인트별·테넌트별 한도) 및 대시보드.
- Express/Fastify/Hono 미들웨어 래퍼.
