# Tech Stack · 087 Meeting Notes

## 프론트엔드
- **Next.js 14 App Router** — SSR + ISR로 공유 페이지 캐시
- **Tailwind CSS** + **shadcn/ui**
- **MDX 2** (`next-mdx-remote`) — 사용자 본문 렌더링
- **TipTap** — WYSIWYG 모드 (선택적 토글)

## 백엔드
- **Next.js Route Handlers** — REST + Server Actions 혼용
- **Zod** — 입력 검증
- **gray-matter** — 노트 프론트매터 파싱

## 액션 아이템 파서
- 순수 함수 `parseActions(markdown)` — 라인 단위 정규식
- 결과: `{ assignee, due, text, line }[]`
- `actions` 테이블 별도 저장으로 대시보드 빠른 조회

## 데이터
- **PostgreSQL** (Neon) — `notes`, `actions`, `workspaces`
- **pg_trgm** + **tsvector** — 풀텍스트 검색
- **S3 (R2)** — 첨부 파일

## 통합
- **Slack** — 슬래시 커맨드 `/note new 1on1`
- **Linear/Jira** — 액션 동기화 (OAuth)
- **Google Calendar** — 이벤트 → 노트 자동 생성

## 인증·결제
- **Clerk Organizations** — 워크스페이스 + SSO
- **Stripe** — 시트 기반 구독

## 인프라
- **Vercel** + **Neon** + **Cloudflare R2**
- **Inngest** — 액션 추출/통합 잡

## 테스트
- **Vitest** — 파서 단위 테스트
- **Playwright** — 노트 생성 → 공유 흐름

## 개발
- pnpm, Biome (lint+format), GitHub Actions
