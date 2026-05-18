# 기술 스택 - 058 API Mocker

## 백엔드 (모킹 엔진)
- **Node.js 20** + **TypeScript**
- **Fastify 4** - 고성능 HTTP 서버 (Express 대비 2배)
- **@fastify/websocket** - WebSocket 모킹 (Pro)
- **@fastify/rate-limit** - 플랜별 RPM 제한
- **Pino** - 구조화 로깅

## 데이터 저장
- **Redis** (Upstash / 자체) - 프로젝트 메타, 요청 로그 (TTL)
- **PostgreSQL** - 사용자, 결제, 영구 프로젝트 (Pro)
- **Prisma ORM**

## Fake 데이터
- **@faker-js/faker** - 다국어 (한국어 로케일 포함)
- 자체 시드 가능한 결정론적 생성

## 스키마
- **Ajv** - JSON Schema 검증
- **@apidevtools/swagger-parser** - OpenAPI 파싱

## 프론트엔드 (대시보드)
- **Next.js 14** - 대시보드 SPA
- **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **SWR** - 실시간 로그 폴링

## CLI
- **Commander.js** + **Node.js**
- npm 글로벌 패키지: `npx @api-mocker/cli`

## 인프라
- **Docker** + **Docker Compose** (개발)
- **Fly.io** 또는 **Railway** - 멀티 리전 (도쿄, 서울)
- **Cloudflare** - DNS, DDoS

## 결제
- **Stripe** 구독 + 사용량 기반 (요청 수)

## 모니터링
- **Sentry** + **Pino** + **OpenTelemetry**
- **Grafana** + **Prometheus** (셀프호스팅)

## 테스트
- **Vitest** - 단위 테스트
- **Fastify inject** - HTTP 통합 테스트
- **k6** - 부하 테스트

## CI/CD
- **GitHub Actions**
- Fly Machines 자동 배포
