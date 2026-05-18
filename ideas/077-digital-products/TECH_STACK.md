# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 결제 페이지(SSR)와 셀러 대시보드(CSR)를 한 코드베이스에서 제공
- **Tailwind CSS + shadcn/ui**: 결제 페이지를 빠르게 디자인하고 셀러가 색상만 커스텀

## Backend
- **Next.js Route Handlers**: /api/checkout, /api/webhook/stripe, /api/download
- **Zod**: webhook payload, 업로드 메타데이터 검증

## 결제
- **Stripe Checkout (hosted)**: 카드/Apple Pay/Google Pay 자동 지원, PCI 부담 제거
- **Stripe Webhooks**: checkout.session.completed → 다운로드 토큰 발급
- 향후 Stripe Connect로 마켓플레이스 정산 모드 추가 가능

## 스토리지
- **AWS S3**: 디지털 파일 저장 (private bucket)
- **서명 URL (presigned)**: 다운로드 시 만료시간 24h, IP 옵션 제한
- **Postgres (Supabase)**: products, orders, download_grants 테이블

## 이메일
- **Resend**: 결제 완료 알림 + 다운로드 링크 전송 (Markdown 템플릿)

## 배포
- **Vercel**: Next.js 네이티브 + Edge Functions
- **환경변수**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AWS_*, RESEND_API_KEY

## 테스트
- **Vitest**: 토큰 생성, webhook 서명 검증, 가격 계산
- **Stripe CLI**: 로컬 webhook fixture 재생

## 선택 이유 요약
- Stripe Checkout은 결제 UX를 위탁할 수 있어 1인 개발자 초기 부담 최소화
- S3 + 서명 URL은 무제한 파일 크기 + 안전한 배포를 한 번에 해결
- Next.js 단일 배포로 셀러 페이지, 결제, webhook, 대시보드를 일원화 가능
