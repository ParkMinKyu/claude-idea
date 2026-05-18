# 기술 스택 - 056 Cron Debugger

## 프론트엔드
- **Next.js 14** (App Router) - SSR + 정적 페이지 혼합
- **React 18** + **TypeScript** - 타입 안전성
- **Tailwind CSS** - 빠른 스타일링
- **shadcn/ui** - 캘린더, 입력, 카드 컴포넌트
- **date-fns** + **date-fns-tz** - 타임존 변환

## Cron 파싱
- **cron-parser** (npm) - 표준 cron 표현식 파싱
- **cronstrue** - cron → 자연어 변환 (한/영 다국어)
- 자체 검증 레이어: AWS / Quartz 확장 처리

## 백엔드 / API
- Next.js Route Handlers - `/api/parse`, `/api/next-runs`
- Edge Runtime - 빠른 응답 (전 세계 < 50ms)
- 인증: NextAuth.js (GitHub OAuth)

## 데이터베이스 (Pro)
- **PostgreSQL** (Supabase / Neon) - 팀 워크스페이스, 라이브러리
- **Prisma ORM**
- **Redis** (Upstash) - 공유 링크 캐시, 레이트 리미트

## 배포
- **Vercel** - 프론트 + Edge Functions
- **Cloudflare** - DNS, DDoS 방어

## 개발 도구
- **Vitest** - 단위 테스트 (cron 파서, 타임존 변환)
- **Playwright** - E2E (캘린더 인터랙션)
- **ESLint** + **Prettier**
- **TypeScript strict mode**

## 모니터링
- **Sentry** - 에러 추적
- **PostHog** - 제품 분석 (공유 링크 클릭률, 변환 유형)

## 결제 (Pro / Team)
- **Stripe** - 구독 결제
- Stripe Customer Portal - 셀프서비스 업그레이드/해지

## CI / CD
- GitHub Actions - 테스트, 빌드, Vercel 배포
- Renovate - 의존성 자동 업데이트
