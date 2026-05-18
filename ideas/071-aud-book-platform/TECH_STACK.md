# Tech Stack · 071 Audiobook Platform

## 프론트엔드
- **Next.js 14 App Router** — 마켓 + 작가 대시보드 + 리스너 PWA
- **Tailwind + shadcn/ui**
- **react-h5-audio-player** — 챕터 네비, 1.0x~2.0x 재생 속도
- **Howler.js** — 백그라운드 재생, Media Session API

## 오디오 처리
- **FFmpeg (sidecar)** — MP3/M4A → M4B 합치기, 챕터 마커 삽입, 워터마크 합성
- **Whisper** — 챕터 자동 자막(접근성)
- **자체 TTS 라우터** — Naver Clova, ElevenLabs (한국어), 라이선스 추적

## 백엔드
- **Next.js Route Handlers**
- **Zod**
- **JWT** — 청취 URL signed (만료 5분, 사용자 ID 바인딩)

## 데이터
- **PostgreSQL 16 (Neon)** — `books`, `chapters`, `purchases`, `listens`, `royalties`, `subscriptions`
- **Drizzle ORM**
- **Redis (Upstash)** — 재생 위치 동기화, 워터마크 시드 캐시

## 저장·전송
- **AWS S3 / Cloudflare R2** — 원본 + M4B
- **CloudFront** — 서명 URL CDN
- **Stripe Connect** — 작가 정산

## 결제·인증
- **NextAuth** (Apple/Google/카카오 OAuth)
- **Stripe Billing** — 구독
- **토스페이먼츠** — 단권/챕터 단건 결제

## 인프라
- **Vercel** — 웹
- **Fly.io Machines** — FFmpeg 변환 워커
- **Sentry** — 오류 추적

## 테스트
- **Vitest** — 정산 계산, 워터마크 시드 생성, 챕터 마커 시간 포맷
- **Playwright** — 구매 → 재생 → 위치 동기화 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
