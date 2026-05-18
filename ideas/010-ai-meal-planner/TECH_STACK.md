# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: PWA로 모바일 설치 가능
- **Tailwind + shadcn/ui**: 모바일 친화 컴포넌트
- **react-camera-pro**: 직접 촬영 옵션

## Backend
- **Next.js Route Handlers**: 이미지 base64로 받아 Claude vision 호출
- **sharp**: 이미지 리사이즈 (전송 비용 절감)

## LLM
- **Claude (claude-opus-4-7)**: vision 입력 가능, 한국어 식자재 인식 우수
- 단일 호출에 재료 인식 + 레시피 추천 동시 요청 → latency/비용 절감

## DB
- **Supabase (Postgres)**: 사용자, 즐겨찾기, 식단 계획
- **Supabase Storage**: 사진 (Pro 사용자만 보관, Free는 즉시 삭제)

## 인증/결제
- **Supabase Auth** (이메일/구글/카카오)
- **Stripe**: 구독

## 배포
- **Vercel**: PWA + Next.js 표준
- **CDN**: 이미지 최적화

## 선택 이유 요약
- Claude vision은 GPT-4o 대비 한국 식자재(반찬, 양념류) 인식 강점
- Next.js PWA로 앱스토어 없이 모바일 경험 가능
- Supabase로 인증/DB/저장 일관 통합
