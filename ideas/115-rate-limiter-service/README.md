# 115 · API 레이트 리밋 서비스

## 개요
토큰 버킷과 슬라이딩 윈도우 두 알고리즘을 모두 구현한 API 레이트 리밋 라이브러리이자
게이트웨이입니다. 클럭 주입(injectable clock) 설계로 시간 의존 로직을 결정론적으로 테스트할
수 있으며, 코어는 의존성 0입니다. Node 내장 HTTP 서버로 즉시 미들웨어/게이트웨이로 사용 가능합니다.

## 문제
- 외부 레이트 리밋 SaaS는 지연·비용·프라이버시 부담이 있습니다.
- 직접 구현 시 버킷 리필/윈도우 만료의 경계 케이스와 테스트가 까다롭습니다.
- 알고리즘 선택(버스트 허용 vs 엄격한 윈도우)이 상황마다 달라 둘 다 필요합니다.

## 솔루션
- 토큰 버킷: 버스트 허용 + 초당 리필, `retryAfterMs` 계산.
- 슬라이딩 윈도우 로그: 정확한 윈도우 경계, 오래된 히트 자동 만료.
- 키별 격리, 표준 헤더(`X-RateLimit-*`, `Retry-After`) 제공 게이트웨이.

## 타겟 사용자
- API 서버를 운영하는 백엔드/플랫폼 엔지니어.
- 멀티테넌트 SaaS에서 테넌트별 한도가 필요한 팀.
- 엣지/게이트웨이 레벨 보호가 필요한 개발자.

## 핵심 기능
1. 토큰 버킷 — capacity/refillPerSec, 버스트 허용, 잔여 토큰 추적.
   - 시간 비례 리필로 부드러운 한도, capacity 초과 누적 방지.
2. 슬라이딩 윈도우 — 정확한 윈도우 내 카운트, 만료 시 용량 회복.
   - 타임스탬프 로그 기반으로 고정 윈도우의 경계 버스트 문제 해소.
3. 키별 격리 — IP/유저/API키 단위 독립 한도.
4. 재시도 안내 — `retryAfterMs`/`Retry-After` 헤더 산출.
5. HTTP 게이트웨이 — Node 내장 서버, 429 응답 + 표준 헤더.

## 사용 예시
```ts
import { TokenBucketLimiter } from './lib/limiter';
const limiter = new TokenBucketLimiter({ capacity: 5, refillPerSec: 1 });
const r = limiter.consume(userIp);
if (!r.allowed) reply.code(429).header('Retry-After', Math.ceil(r.retryAfterMs / 1000));
```
클럭 주입(`now`)으로 테스트에서 시간을 제어해 결정론적으로 검증합니다.

## 도입 시나리오
- 공개 API의 IP/토큰별 한도로 남용·DoS 완화.
- 멀티테넌트 SaaS에서 플랜별 차등 한도 적용.
- 엣지 게이트웨이에서 백엔드 보호용 1차 방어선.

## 수익 모델
- 오픈코어: 두 알고리즘 + 게이트웨이는 MIT 오픈소스(인메모리).
- SaaS Pro 가격 티어:
  - Free: 인메모리 라이브러리.
  - Pro ($25/월): Redis 분산 백엔드, 정책 대시보드, 메트릭.
  - Team ($120/월): 멀티리전 동기화, 테넌트 정책, 알림/감사.

## 경쟁사
- express-rate-limit — Express 종속, 알고리즘 선택 제한.
- Kong / AWS API Gateway throttling — 인프라 종속, 비용.
- Upstash Ratelimit — Redis 필수, 외부 서비스 의존.

## 차별점
- 토큰 버킷 + 슬라이딩 윈도우 동일 인터페이스로 동시 제공.
- 클럭 주입으로 시간 로직까지 결정론적 테스트.
- 의존성 0 코어 → 엣지/서버리스에서도 가벼움.
- 인메모리에서 시작해 Redis 백엔드로 무중단 확장.

## KPI
- 라이브러리 설치 수, 게이트웨이 처리 요청 수.
- 차단된(429) 요청 비율(보호 효과 지표).
- Free→Pro(Redis 백엔드) 전환율.
- 평균 한도 정책 수(정책 복잡도 지표).

## 로드맵
- v0.1: 토큰 버킷 + 슬라이딩 윈도우 + HTTP 게이트웨이(현재).
- v0.2: Express/Fastify/Hono 미들웨어 어댑터.
- v0.3: Redis/Upstash 분산 백엔드, 정책 DSL.
- v1.0: 멀티리전 동기화, 대시보드, 알림(Team).
