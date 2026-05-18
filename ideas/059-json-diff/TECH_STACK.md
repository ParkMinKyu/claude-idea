# 기술 스택 - 059 JSON Diff Viewer

## 프론트엔드
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Monaco Editor** (`@monaco-editor/react`) - VS Code 에디터
- **Tailwind CSS** + **shadcn/ui**
- **react-virtuoso** - 대용량 트리 가상화

## Diff 엔진
- **자체 deep-diff 알고리즘** - JSON 객체 재귀 비교
- **fast-json-patch** - RFC 6902 JSON Patch 생성/적용
- **js-yaml** - YAML 파싱
- **smol-toml** - TOML 파싱

## 백엔드
- Next.js Route Handlers
- 인증: **NextAuth.js** (GitHub / Google)
- 공유 링크: **Upstash Redis** (Free 24h TTL, Pro 영구)

## 데이터베이스
- **PostgreSQL** (Supabase) - 사용자, 영구 공유, 환경 모니터링
- **Prisma**

## 환경 모니터링 (Pro)
- **BullMQ** (Redis) - 주기 fetch + diff 계산
- **Resend** - 이메일 알림
- **Slack Webhook** - 변경 알림

## CLI (Pro)
- **Node.js** + **Commander**
- npm: `@json-diff/cli`

## 배포
- **Vercel** - 프론트 + Edge
- **Render** 또는 **Railway** - 백그라운드 워커

## 결제
- **Stripe**

## 테스트
- **Vitest** - diff 알고리즘
- **Playwright** - Monaco 인터랙션 E2E

## 모니터링
- **Sentry**, **PostHog**

## CI/CD
- **GitHub Actions** + **Vercel preview**
