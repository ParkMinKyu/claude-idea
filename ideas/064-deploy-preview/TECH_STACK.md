# 기술 스택 - 064 Deploy Preview

## 백엔드 / 컨트롤 플레인
- **Node.js 20** + **TypeScript**
- **Fastify 4** - GitHub webhook 처리, REST API
- **BullMQ** + **Redis** - 빌드 작업 큐
- **@octokit/webhooks** - GitHub 시그니처 검증

## 빌드 / 런타임
- **Docker Engine** (직접) - 빌드 + 런
- 옵션: **Docker Buildx** + buildkit 캐시
- **docker-compose** - 다중 서비스 PR 환경
- 격리: 컨테이너 네트워크 PR마다 분리

## 오케스트레이션 (선택)
- 소규모: 단일 Docker host + Traefik
- 대규모: **Kubernetes** + **Helm**
- **k3s** (셀프호스팅 권장)

## 동적 라우팅
- **Traefik 3** - 와일드카드 라우팅 `*.preview.example.com`
- **Let's Encrypt** + DNS-01 challenge

## DNS 자동화
- **Cloudflare API** - A 레코드 자동 생성
- 또는 와일드카드 DNS (`*.preview` → 로드밸런서 IP)

## 데이터베이스 격리
- PostgreSQL: 템플릿 DB → CREATE DATABASE FROM TEMPLATE
- Redis: 네임스페이스 (DB 번호 또는 키 prefix)
- 자동 시드 SQL 실행

## 프론트엔드 (대시보드)
- **Next.js 14** - 빌드 로그, 환경 목록
- **React** + **Tailwind**
- 실시간 로그: WebSocket (Fastify)

## 데이터베이스 (메타)
- **PostgreSQL** - 조직, 리포, 환경, 빌드
- **Prisma**

## 결제
- **Stripe** (Cloud 플랜만)

## 보안
- GitHub App private key (KMS 저장)
- 빌드 격리: rootless Docker / gVisor
- 시크릿: HashiCorp Vault 또는 sealed-secrets

## 테스트
- **Vitest** - 라우팅, webhook 처리
- **testcontainers** - 통합 테스트
- **Playwright** - 대시보드 E2E

## 모니터링
- **Prometheus** + **Grafana** (셀프호스팅)
- **Sentry**

## CI/CD
- **GitHub Actions** - 자체 빌드 + 멀티아치 (amd64/arm64)
- 이미지: `ghcr.io/deploy-preview/controller`
