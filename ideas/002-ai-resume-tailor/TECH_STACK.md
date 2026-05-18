# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: React Server Components로 PDF 파싱 결과 직접 렌더
- **Tailwind CSS**: 깔끔한 폼 UI
- **diff (npm)**: 원본↔맞춤 이력서 변경 사항 시각화

## Backend
- **Next.js Route Handlers**: 단일 서비스로 운영 단순화
- **pdf-parse**: 업로드된 이력서 PDF 텍스트 추출
- **Zod**: JD 분석 결과 스키마 검증

## LLM
- **Claude (claude-opus-4-7)**: 한국어 + 영어 동시 처리 품질, 긴 컨텍스트로 이력서 전문 + JD 동시 처리
- 사실 왜곡 방지 가드: system prompt + 결과 검증(원본 키워드 vs 생성 키워드 교집합 체크)

## DB
- **MVP**: 무상태 — 사용자 데이터는 처리 후 즉시 폐기 (개인정보 우려 최소화)
- **Phase 2**: Supabase로 이력서/JD 히스토리 + Stripe 결제

## 배포
- **Vercel**: 빠른 배포, 함수 타임아웃 60s로 LLM 호출 충분
- **Stripe**: 구독 + 1회 결제 동시 운영

## 선택 이유 요약
- 이력서는 민감 정보 → 무상태 처리로 신뢰 확보
- Next.js 단일 스택으로 빠르게 출시 가능
- Claude의 긴 컨텍스트 능력이 이력서 전체 + JD 동시 입력에 적합
