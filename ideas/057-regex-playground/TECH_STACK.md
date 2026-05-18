# 기술 스택 - 057 Regex Playground

## 프론트엔드
- **Next.js 14** App Router
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **CodeMirror 6** - 정규식 편집기, 신택스 하이라이트
- **Zustand** - 클라이언트 상태 관리

## AI
- **Anthropic SDK** (`@anthropic-ai/sdk`)
- 모델: **Claude Sonnet** (생성/설명)
- 프롬프트 캐싱: 시스템 프롬프트 + 예시 패턴 (1시간 TTL)
- 스트리밍 응답 (UX 개선)

## 정규식 엔진
- 브라우저 네이티브 **RegExp** (JS 방언)
- **re2-wasm** (Pro): RE2 엔진 (안전한 평가)
- 언어 변환 라이브러리: 자체 AST 기반 변환기

## 백엔드
- Next.js Route Handlers - `/api/generate`, `/api/explain`
- 인증: **NextAuth.js** (GitHub / Google)
- 레이트 리미트: **Upstash Redis** (Free tier 일 5회)

## 데이터베이스
- **PostgreSQL** (Supabase) - 사용자, 저장된 패턴, 팀
- **Prisma ORM**

## 결제
- **Stripe** 구독

## 배포
- **Vercel**
- **Cloudflare** CDN + WAF

## 테스트
- **Vitest** - 정규식 엔진, 언어 변환기
- **Playwright** - E2E (AI 생성 모킹)

## 모니터링
- **Sentry** - 에러
- **PostHog** - 분석
- **Helicone** - LLM 호출 관찰

## CI/CD
- GitHub Actions
- Vercel preview 환경
