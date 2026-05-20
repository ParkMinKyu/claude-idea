# Tech Stack · 102 JWT Debugger

## 프레임워크
- **Next.js 14 App Router** — 정적 export 가능해 CDN/인트라넷 배포 용이
- **React 18** — 클라이언트 컴포넌트(`"use client"`)에서 디코드 수행, 토큰이 서버로 전송되지 않음

## JWT 처리
- **jose 5** — 브라우저/Node 양쪽에서 동작하는 표준 JWT/JWK 라이브러리. HS/RS/ES/EdDSA 전 알고리즘 지원
- 디코딩은 jose 없이 순수 base64url 파싱으로 구현(키 불필요, 의존성 최소화)

## 왜 클라이언트 사이드인가
- 운영 토큰을 외부 서버로 보내지 않는 것이 핵심 차별점
- `decodeJwt`/`inspectClaims`는 순수 함수 → 브라우저에서 직접 실행, 서버 라운드트립 없음
- 정적 빌드 결과물만 배포하면 되어 운영 비용 최소

## 검증 키 관리
- 시크릿: `TextEncoder` 인코딩
- 공개키: `importSPKI`(PEM), `importJWK`(JWK)
- JWKS URL: 상용판에서 fetch + kid 매칭(브라우저에서 직접, CORS 허용 시)

## 프론트엔드 UI
- **Tailwind CSS** + **shadcn/ui**
- 모노스페이스 코드 뷰 + JSON 트리

## 인프라
- **Vercel** 또는 정적 호스팅(S3/Cloudflare Pages)
- 셀프호스팅: `next build && next export`로 단일 정적 디렉터리

## 테스트
- **Vitest** — 디코드/클레임/검증을 jose `SignJWT`로 생성한 토큰으로 오프라인 검증

## 선택 이유 요약
프라이버시(토큰 비전송)가 제품의 정체성이므로 SSR 대신 클라이언트 처리를 1급으로 두고, 알고리즘 정확성을 위해 검증에는 검증된 jose 라이브러리를 사용했다.
