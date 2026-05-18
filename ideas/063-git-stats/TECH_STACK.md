# 기술 스택 - 063 Git Stats

## 프론트엔드
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** + **D3** - 시각화 (히트맵, 트리맵)
- **TanStack Query** - 데이터 페칭/캐싱

## 백엔드 / 분석
- Next.js Route Handlers - REST API
- **simple-git** (Node) - .git 직접 파싱
- **@octokit/rest** - GitHub API
- **@gitbeaker/node** - GitLab API
- **BullMQ** + Redis - 백그라운드 분석 작업

## 데이터베이스
- **PostgreSQL** (Supabase) - 사용자, 리포 메타, 분석 결과
- **TimescaleDB** 확장 - 시계열 (주간/월간 추세)
- **Prisma**
- **Redis** - 캐시 + 큐

## CLI (로컬 분석)
- **Node.js** + **simple-git**
- 출력: JSON (대시보드 import 가능)
- `git-stats analyze ./my-repo > stats.json`

## PDF 리포트
- **@react-pdf/renderer**

## 인증
- **NextAuth.js** (GitHub, GitLab OAuth)

## 배포
- **Vercel** - 웹
- **Render** - 백그라운드 워커 (큰 리포 분석)

## 결제
- **Stripe**

## 테스트
- **Vitest** - 분석 알고리즘 (hotspot, bus factor)
- **Playwright** - 대시보드 E2E

## 모니터링
- **Sentry**, **PostHog**

## 보안 / 개인정보
- OAuth scope: 최소 (read:repo)
- 분석 후 .git 로컬 캐시는 24h TTL
- GDPR 우호 (한국 PIPA 호환)

## CI/CD
- **GitHub Actions**
- Vercel preview + Render auto deploy
