# 기술 스택

## Frontend
- **Next.js 14 + TypeScript**: 폼 + 결과 카드 UI 단순
- **Tailwind CSS**
- **shadcn/ui**: 카드/탭/버튼 컴포넌트

## Backend
- **Next.js Route Handlers**: 메일 생성 API
- **Zod**: 입력/출력 검증

## LLM
- **Claude (claude-opus-4-7)**: 개인화 메일은 추론 깊이가 회신율을 결정 → opus 사용
- 3가지 톤은 단일 요청에 묶어서 처리 (비용 1번)

## 프로필 파싱
- **MVP**: 사용자가 LinkedIn 프로필 텍스트 직접 복사 → LinkedIn ToS 회피
- **Phase 2**: Proxycurl API (유료 LinkedIn 데이터 합법 사용)

## DB
- **Supabase (Postgres)**: 발신자 프로필, 생성 히스토리, 사용량 카운터
- **Supabase Auth**: 이메일/구글 로그인

## 배포
- **Vercel**
- **Stripe**: 구독 결제

## 선택 이유 요약
- LinkedIn 직접 스크래핑은 ToS 위반 — 사용자 복사 방식이 안전
- Claude opus는 컨텍스트 풍부할수록 진가 발휘 → 콜드메일에 적합
- Next.js + Vercel + Supabase로 1주일 내 MVP 가능
