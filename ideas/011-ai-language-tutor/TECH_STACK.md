# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: 앱 라우터 + 클라이언트 컴포넌트
- **Web Speech API**: 브라우저 내장 STT(SpeechRecognition) + TTS(SpeechSynthesis) — 무료
- **Tailwind**: 대화 UI

## Backend
- **Next.js Route Handlers**: 채팅 endpoint + 피드백 endpoint
- 대화 컨텍스트는 클라이언트에서 관리 (서버 무상태)

## LLM
- **Claude (claude-opus-4-7)**: 자연스러운 대화 + 정확한 문법 피드백
- 단일 응답에 (대화 답변 + 피드백 JSON) 동시 생성 → latency 절감
- streaming으로 사용자 체감 빠르게

## DB
- **Supabase (Pro 이상)**: 단어장, 대화 히스토리, 진도
- **MVP Free**: 로컬 스토리지

## TTS 업그레이드 (Pro)
- **OpenAI TTS** 또는 ElevenLabs: 자연스러운 음성
- Free는 브라우저 기본 음성

## 배포
- **Vercel**
- **Stripe**: 구독

## 선택 이유 요약
- Web Speech API로 STT/TTS 비용 0원 → Free 플랜 성립
- Claude opus는 대화 문맥 유지 + 즉각 피드백 동시 처리 가능
- 클라이언트 컨텍스트로 서버 단순화
