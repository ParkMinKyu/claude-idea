# Tech Stack · 093 Voice Memo Organizer

## 프론트엔드
- **Next.js 14 App Router** + **PWA** (오프라인 녹음 → 큐)
- **Tailwind + shadcn/ui**
- **MediaRecorder API** — 브라우저 녹음, opus 인코딩

## 백엔드
- **Next.js Route Handlers**
- **OpenAI Whisper API** — `whisper-1` (또는 self-host large-v3 on Replicate)
- **Anthropic Claude API** — 요약/할 일 추출
- **Inngest** — 잡 큐 (전사 → 정리 → 인덱싱)
- **Resend Inbound** — 이메일 첨부 입력

## 도메인 로직
- 요약 프롬프트: 한국어 우선, JSON 응답 (`{summary, tasks, tags}`)
- 프롬프트 캐싱 활용 (시스템 프롬프트 cache_control)
- 토큰 카운트로 요금 계산

## 데이터
- **Postgres** (Neon) — `memos`, `transcripts`, `summaries`
- **S3 (R2)** — 원본 오디오 (90일 후 자동 삭제 옵션)

## 인증·결제
- **Clerk**
- **Stripe** — 분량 기반 (metered usage)

## Export 통합
- **Notion API**, **Todoist API**, **Obsidian** (마크다운 다운로드)

## 인프라
- **Vercel** + **Neon** + **R2**
- **Sentry** + **PostHog** (사용량 분석)

## 테스트
- **Vitest** — 요약 파싱, 요금 계산, export 매퍼
- 모의 Claude/Whisper 응답으로 통합 테스트

## 개발
- TypeScript, pnpm, Biome
