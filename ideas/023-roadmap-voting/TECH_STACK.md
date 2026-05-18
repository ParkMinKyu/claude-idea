# Tech Stack · 023 Roadmap Voting

## 프론트엔드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **dnd-kit** — 관리자 칸반 정렬

## 백엔드
- **Next.js Route Handlers** — `/api/posts`, `/api/votes`, `/api/comments`
- **PostgreSQL (Neon)** + **Drizzle**
- 유니크 인덱스 `(post_id, voter_email)`로 중복 투표 방지

## 인증
- **Clerk** (관리자)
- **이메일 매직 링크** (투표자)
- Cloudflare Turnstile

## 알림
- **Resend** — 상태 변경 메일
- **Slack/Discord webhook** — 신규 요청

## 임베드 위젯
- Vanilla JS 8KB

## 결제
- **Stripe Billing**

## 테스트
- **Vitest** — 투표 중복 방지, 점수 계산, 정렬
- **Playwright** — 게시 → 투표 → 상태 변경 흐름
