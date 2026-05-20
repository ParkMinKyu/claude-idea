# TECH STACK · Webhook Relay

## 언어/런타임
- Node.js 22 (ESM), 의존성 0 (stdlib `http`, `crypto`)
- 라우팅/버퍼 코어는 전송 계층과 무관 → WebSocket/SSE/HTTP 어디든 결합

## 코어 라이브러리 (`src/relay.js`)
- `RelayHub`: 터널 레지스트리 + 구독자 팬아웃 + 링 버퍼
- `ingest`: 인바운드 웹훅 수신, 시퀀스 부여, 버퍼링, 다중 전달
- `replay(afterSeq)`: 재연결 시 누락분 재생
- `resolveTarget`: prefix/regex 매칭 + 경로 rewrite로 로컬 타깃 결정
- `makeTunnelId`: 서브도메인 친화 슬러그 생성(rng 주입 가능)

## 서버 (`src/server.js`)
- `POST /t/:id/*` → ingest, `GET /t/:id/events` → SSE 구독
- 로컬 에이전트는 SSE로 수신 후 로컬 HTTP로 포워딩

## 테스트
- `node --test` (의존성 없이 `npm test`)
- 검증 포인트: 팬아웃, 실패 격리, 링 버퍼 재생, unsubscribe, 라우팅

## 운영/확장
- 에지 게이트웨이(여러 리전) + 중앙 레지스트리(Redis)로 수평 확장
- 재생 보관은 Redis Streams/Postgres, 보관 기간 티어별 차등
- 인증: 터널별 토큰, mTLS 옵션(엔터프라이즈)

## 보안
- 터널 토큰으로 ingest/subscribe 권한 분리
- 페이로드는 전송 중 암호화, 로컬 외 영속 저장은 옵션화
