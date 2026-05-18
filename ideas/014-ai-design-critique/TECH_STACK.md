# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**
- **Tailwind + shadcn/ui**
- **react-dropzone**: 멀티 이미지 업로드

## Backend
- **Next.js Route Handlers**: 이미지 base64로 받아 Claude vision 호출
- **sharp**: 이미지 압축 (5MB → 1MB, 토큰 비용 절감)

## LLM
- **Claude (claude-opus-4-7)**: vision + 시스템 프롬프트에 닐슨 휴리스틱 + WCAG 임베드
- 멀티 이미지 단일 호출 가능 (최대 5장)

## PDF
- **jsPDF + html2canvas**: 클라이언트 사이드 PDF 생성 (서버 부담 X)

## DB
- **Supabase**: 사용량, 결제, 분석 히스토리 (Pro만 저장)
- **MVP Free**: 무상태

## 배포
- **Vercel**
- **Stripe**

## 선택 이유 요약
- Claude vision은 UI 컴포넌트 식별 + UX 추론 양쪽에서 우수
- Next.js + Supabase + Stripe로 빠른 SaaS 셋업
- 클라이언트 PDF 생성으로 서버 비용 절감
