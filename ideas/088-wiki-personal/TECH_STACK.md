# Tech Stack · 088 Personal Wiki

## 프론트엔드
- **Next.js 14 App Router** — 웹 + PWA
- **Tailwind + shadcn/ui**
- **CodeMirror 6** — Markdown 에디터 (위키 링크 토큰 하이라이트)
- **D3-force** — 그래프 뷰

## 백엔드
- **Next.js Route Handlers**
- **better-sqlite3** — 로컬 모드 (단일 파일 .db)
- **Postgres** (Neon) — 클라우드 모드, FTS는 `tsvector` + GIN

## 도메인 로직
- 위키 링크 파서: `[[title]]`, `[[title|alias]]` 지원
- 백링크 인덱스: `links(from_id, to_title)` 테이블
- 검색: BM25 정렬 + 제목 부스트 ×3

## 동기화
- 로컬 SQLite → 클라우드: CRDT(yjs) 대신 단순 last-write-wins (MVP)
- WebSocket 채널: Cloudflare Durable Objects

## 인증·결제
- **Clerk** — 이메일 매직링크
- **Stripe** — Pro 구독 + Lifetime 단건

## 인프라
- **Vercel** + **Neon** + **Cloudflare Workers**
- **Sentry**

## 테스트
- **Vitest** — 링크 파서, 백링크 인덱스, 검색 랭킹
- **Playwright** — 노트 작성 → 검색 → 그래프 진입

## 개발 도구
- pnpm, Biome, GitHub Actions
- `wiki-cli`: CLI로 노트 일괄 import (Obsidian → wiki)
