# Tech Stack · 068 Podcast Host

## 프론트엔드
- **Next.js 14 App Router** — 대시보드 + 공개 에피소드 페이지
- **Tailwind + shadcn/ui**
- **Wavesurfer.js** — 파형 표시 + 챕터 마커
- **react-h5-audio-player** — 임베드 플레이어

## 업로드·미디어
- **AWS S3 (또는 Cloudflare R2)** — 원본 + 트랜스코딩 결과 저장
- **pre-signed PUT URL** — 브라우저 직접 업로드
- **FFmpeg (sidecar 컨테이너)** — MP3 192kbps 변환, ID3 태그 삽입
- **Whisper API** — 한국어 자동 트랜스크립트

## 백엔드·RSS
- **Next.js Route Handlers** — API
- **자체 RSS XML builder** — iTunes/Spotify 사양 준수
- **stale-while-revalidate** — RSS 1시간 캐싱, 새 에피소드 즉시 invalidate

## 데이터
- **PostgreSQL 16 (Neon)** — `podcasts`, `episodes`, `downloads`, `users`
- **Drizzle ORM**
- **ClickHouse** (옵션) — 다운로드 이벤트 집계 (월 100만+ 시)

## 다운로드 통계 (IAB 2.1)
- **User-Agent 봇 필터** (IAB blocklist 사용)
- **IP /24 dedupe (24시간 윈도우)**
- **Range request 합산 처리** (chunked 다운로드는 1회로 계산)

## 결제·인증
- **NextAuth** (이메일 + Google)
- **Stripe Billing** — 글로벌 구독
- **토스페이먼츠** — 한국 결제 + 세금계산서

## 인프라
- **Vercel** — 웹 + API
- **Fly.io Machines (FFmpeg 워커)**
- **CloudFront** — MP3 CDN

## 테스트
- **Vitest** — RSS 빌더, IAB 다운로드 필터
- **Playwright** — 업로드 → RSS 확인 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions CI
