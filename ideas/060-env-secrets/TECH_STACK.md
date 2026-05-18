# 기술 스택 - 060 Env Secrets

## 암호화
- **libsodium-wrappers** - WASM 빌드 (브라우저/Node 공통)
- **NaCl box** (X25519 키 교환 + XSalsa20-Poly1305 AEAD)
- **Argon2id** - 마스터 패스워드 → 키 유도 (KDF)
- 각 멤버는 고유 X25519 키쌍 보유; 워크스페이스 마스터 키는 멤버 공개키마다 wrap

## 프론트엔드
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Web Crypto** + **libsodium** (브라우저)
- 모든 복호화는 클라이언트에서

## 백엔드
- Next.js Route Handlers - 암호문만 처리
- 인증: **NextAuth.js** (GitHub / Google)
- 인가: 워크스페이스 RBAC (Postgres RLS)

## 데이터베이스
- **PostgreSQL** (Supabase) - 사용자, 워크스페이스, 멤버 공개키, wrapped 키, 암호문, 감사 로그
- **Prisma**
- Row Level Security 활성화

## CLI
- **Node.js** + **Commander**
- libsodium 동일 사용 (코드 공유)
- 로컬 키 저장: OS 키체인 (`keytar`)
- 명령: `envs init`, `envs login`, `envs pull`, `envs push`, `envs run -- npm start`

## CI 통합 (Pro)
- 서비스 토큰 (read-only)
- GitHub Action: `actions/envs-action`

## 배포
- **Vercel** - 웹 + API
- **Cloudflare** - DDoS / WAF

## 결제
- **Stripe** + 토스페이먼츠 (한국)

## 테스트
- **Vitest** - 암호화 라운드트립, KDF
- **Playwright** - E2E 로그인 + sync

## 모니터링
- **Sentry** (PII 절대 미전송 검증)
- **PostHog** (오직 익명 이벤트)
- 보안 모니터링: 감사 로그 → SIEM webhook

## CI/CD
- **GitHub Actions**
- 정기 침투 테스트 (Pro / Team)
