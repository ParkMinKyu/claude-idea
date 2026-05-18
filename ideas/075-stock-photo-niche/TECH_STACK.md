# Tech Stack · 075 Stock Photo Niche

## 프론트엔드
- **Next.js 14 App Router** — 마켓 + 검색 + 작가 대시보드
- **Tailwind + shadcn/ui**
- **next/image** — 최적화된 썸네일 + lazy load
- **react-photo-album** — masonry 그리드

## 이미지 처리
- **Sharp** — 업로드 시 WebP/AVIF 변환, 4단계 사이즈 (200/600/1600/원본)
- **EXIF 제거** — 위치·카메라 정보 자동 제거 (구매자에게는 원본 EXIF 옵션)
- **Watermark overlay** — 미구매 미리보기에 워터마크 합성

## 검색·임베딩
- **PostgreSQL `tsvector`** — 한글 키워드 인덱스
- **pgvector** — CLIP 임베딩으로 시각적 유사 검색
- **Claude** — 작가 업로드 시 자동 태그 제안 (한국어)

## 백엔드
- **Next.js Route Handlers** + **Zod**
- **JWT signed URL** — 구매 이미지 24시간 다운로드 링크

## 데이터
- **PostgreSQL 16 (Neon)** — `photos`, `models`, `model_releases`, `licenses`, `purchases`, `payouts`
- **Drizzle ORM**
- **Cloudflare R2** — 원본·썸네일 저장
- **CloudFront** — 글로벌 CDN

## 결제·정산
- **Stripe Checkout + Connect** — 글로벌 + 작가 자동 정산
- **토스페이먼츠** — 한국 카드, 세금계산서 발행
- **PortOne(아임포트)** — 보조 PG

## 인증
- **NextAuth** (이메일 + Google)
- **PASS / NICE** — 작가 본인 인증 (성인 + 사업자 식별)

## 인프라
- **Vercel** — 웹
- **Cloudflare R2 + CDN**
- **Sentry**

## 테스트
- **Vitest** — 라이센스 PDF 메타데이터, 정산 계산, 모델 동의 범위 매칭
- **Playwright** — 검색 → 구매 → 다운로드 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint, GitHub Actions
