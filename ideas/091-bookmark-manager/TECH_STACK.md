# Tech Stack · 091 Bookmark Manager

## 확장 (저장 클라이언트)
- **Chrome MV3** — 현재 탭 + 선택 텍스트 캡처
- **Vanilla TS + Vite**, 번들 < 50KB
- 단축키: `commands` 매니페스트로 `Ctrl+Shift+S`

## 웹 대시보드
- **Next.js 14 App Router**
- **Tailwind + shadcn/ui**
- **InstantSearch** UI (Meilisearch backed)

## 백엔드
- **Hono on Node 20** (Edge 호환)
- **cheerio + metascraper** — OG/meta 추출
- **Readability.js** — 본문 텍스트 추출
- **TF-IDF** 키워드 추출 (`natural` 라이브러리)

## 데이터·검색
- **Postgres** (Neon) — 정규화 데이터
- **Meilisearch** — 풀텍스트 검색 인덱스
- **S3 (R2)** — 본문 스냅샷 저장

## 인증·결제
- **Clerk** + **Stripe** (Lifetime은 단건 결제)

## 인프라
- **Vercel** + **Neon** + **Meilisearch Cloud**
- **Sentry**

## 테스트
- **Vitest** — 메타 추출, 태그 제안, 검색 쿼리 빌더
- **Playwright** — 확장 popup + 대시보드

## 개발
- pnpm, TypeScript, Biome
- 마이그레이션 도구: `import-pocket.ts`, `import-raindrop.ts`
