# 기술 스택

## Frontend
- **Next.js 14 (App Router) + TypeScript**: 서버 액션과 streaming UI로 LLM 응답을 자연스럽게 렌더링
- **Tailwind CSS**: 빠른 프로토타이핑, 디자인 시스템 일관성
- **React Markdown**: 결과 Markdown 미리보기

## Backend
- **Next.js Route Handlers (API Routes)**: 별도 백엔드 없이 단일 배포로 MVP 단순화
- **Zod**: LLM 출력 JSON 스키마 검증

## LLM
- **Anthropic Claude (claude-opus-4-7)**: 한국어 추론 성능, 긴 컨텍스트(200k), 구조화 출력 안정성
- 액션 아이템 추출은 tool use(structured output)로 신뢰도 확보
- 향후 비용 최적화 시 claude-sonnet-4-6으로 다운그레이드 가능한 구조

## DB
- **MVP**: 파일/메모리 기반 — 회의록은 1회성 처리 가정
- **Phase 2**: Supabase(Postgres + Auth) — 사용자별 회의록 히스토리, 팀 공유

## 배포
- **Vercel**: Next.js 네이티브, edge functions로 글로벌 저지연
- **환경변수**: ANTHROPIC_API_KEY는 Vercel secret으로 관리
- **모니터링**: Vercel Analytics + Sentry (LLM 에러 추적)

## 선택 이유 요약
- 모든 기능을 단일 Next.js 코드베이스로 처리 가능 → 1인 개발자도 운영 가능
- Claude Opus는 한국어 회의록 요약 품질이 GPT-4 대비 우수
- 초기에는 인증/DB 없이도 동작하여 학습 비용 최소화
