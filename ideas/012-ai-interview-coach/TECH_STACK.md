# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: 폼 + 채팅형 UI
- **Tailwind + shadcn/ui**
- **React Hook Form**: 답변 입력 폼

## Backend
- **Next.js Route Handlers**: 질문 생성 + 답변 분석 endpoint
- **Zod**: 입출력 검증

## LLM
- **Claude (claude-opus-4-7)**: 면접 답변 분석은 추론 깊이 핵심
- 질문 생성과 답변 분석을 별도 호출 (캐싱 기회)

## DB
- **Supabase**: 사용자 진도, 약점 추적, 결제 상태
- **Stripe**: 구독 + 1회 결제

## 음성 (Pro)
- **Web Speech API**: 답변을 말로 입력
- **Whisper (Pro+)**: 정확한 STT 필요한 경우

## 배포
- **Vercel**

## 선택 이유 요약
- Next.js로 단일 코드베이스 + 빠른 배포
- Claude opus는 미묘한 답변 품질 판별에 우수
- Supabase로 진도 추적 빠르게 구현
