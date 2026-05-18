# Tech Stack · 074 Quote Generator

## 프론트엔드
- **Next.js 14 App Router** — 생성기 + 마켓 + 상품 페이지
- **Tailwind + shadcn/ui**
- **HTML5 Canvas** — 카드 합성
- **react-color** — 컬러 피커

## 디자인 시스템
- **자체 폰트** — 한글 캘리그라피 라이선스 폰트 10+ 종 (SIL OFL 또는 매입)
- **템플릿 JSON 스키마** — 배경·폰트·정렬·패딩 정의

## 백엔드
- **Next.js Route Handlers**
- **Zod**
- **node-canvas** — PDF/PNG 서버 렌더 (시리즈 PDF 생성용)
- **PDFKit** — 30일 PDF 묶음

## AI
- **Anthropic Claude Sonnet** — 문장 분위기 분류 + 템플릿 추천
- **출처 검색**: Claude + 시드 데이터(고전 명언 DB)

## 데이터
- **PostgreSQL 16 (Neon)** — `quotes`, `templates`, `template_packs`, `orders`, `pdf_series`
- **Drizzle ORM**
- **Cloudflare R2** — 생성 이미지 저장

## 결제·인증·POD
- **NextAuth** (Google·카카오)
- **Stripe Checkout** — 글로벌 일회성/구독
- **토스페이먼츠** — 한국 카드
- **Printful API** — POD 자동 등록 (엽서/포스터/티셔츠)
- **자체 한국 POD 파트너** — 엽서/포스터 인쇄

## 인프라
- **Vercel** — 웹
- **Cloudflare R2 + CDN** — 이미지·PDF 호스팅
- **Sentry**

## 테스트
- **Vitest** — 분위기 분류 매칭, 정산 계산, PDF 메타데이터
- **Playwright** — 카드 생성 → 다운로드 E2E

## 개발 도구
- pnpm, TypeScript strict, ESLint
