# Tech Stack · 105 Base64 Toolkit

## 프레임워크
- **Next.js 14 App Router** — 정적 export 가능, CDN/인트라넷 배포 용이
- **React 18** — 클라이언트 컴포넌트에서 변환 수행 → 데이터 비전송

## 코덱 코어
- **Node Buffer / 브라우저 폴리필** — base64/base64url/hex를 표준 API로 처리
- `encodeURIComponent`/`decodeURIComponent` — URL 퍼센트 인코딩
- 순수 함수 설계 → 동일 코어를 웹 UI와 (상용) API에서 재사용

## 왜 클라이언트 사이드인가
- 토큰·페이로드 같은 민감 데이터를 외부로 보내지 않는 것이 차별점
- 변환 함수가 부작용 없는 순수 함수라 브라우저에서 직접 실행
- 정적 빌드만 배포하면 되어 운영 비용 최소

## 포맷 감지
- 입력 패턴(문자 집합·길이·% 시퀀스)을 정규식으로 분류
- base64url은 `-`/`_` 존재로 base64와 구분

## UI
- **Tailwind CSS** + **shadcn/ui**
- 모드(encode/decode) × 포맷 선택 + 실시간 출력 + 감지 배지

## API 서비스(상용)
- **Hono on Cloudflare Workers** — 엣지 배치 변환 API
- 파일 변환은 스트리밍 처리로 대용량 지원

## 인프라
- **Vercel** 또는 정적 호스팅(Cloudflare Pages)

## 테스트
- **Vitest** — 라운드트립·알려진 값·검증·감지·변환을 오프라인 단위 테스트(한글/이모지 포함)

## 선택 이유 요약
프라이버시와 단순성이 핵심이라 서버 의존을 없애고 코덱을 순수 함수로 분리했다. 같은 코어를 정적 웹과 엣지 API 양쪽에서 재사용해 일관성과 유지보수성을 확보한다.
