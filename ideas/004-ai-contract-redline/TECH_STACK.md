# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: App Router + Server Actions
- **PDF.js (pdfjs-dist)**: 브라우저 측 PDF 텍스트 추출 → 원문 업로드 없이 분석 (개인정보/계약 비밀 보호)
- **react-pdf-highlighter**: PDF 위에 위험 조항 하이라이트 오버레이

## Backend
- **Next.js Route Handlers**: 클라이언트에서 추출된 텍스트만 받아서 Claude 호출
- 원본 PDF는 절대 서버로 전송 X

## LLM
- **Claude (claude-opus-4-7)**: 법률 추론 정확도, 긴 컨텍스트
- system prompt에 한국 표준 약관 요점 + 일반적 위험 조항 패턴 임베드
- 출력: 각 조항별 위험도(low/medium/high) + 사유 + 대안 문구

## DB
- **MVP**: 무상태
- **Phase 2**: Supabase — 분석 히스토리, 자체 템플릿 저장

## 배포
- **Vercel**: Edge runtime은 PDF 처리에 무리, Node runtime 사용
- **결제**: Stripe (구독 + 1회 결제)

## 선택 이유 요약
- 계약서는 극도로 민감 → 브라우저 측 처리로 신뢰 확보
- Claude는 한국어 법률 텍스트 이해도가 GPT 대비 우수 (자체 테스트 기준)
- Next.js로 단일 코드베이스 운영
