# TECH STACK · Color Contrast Checker

## 언어/런타임
- Node.js 22 (ESM), 의존성 0 — WCAG 공식은 순수 산술이라 외부 패키지가 불필요
- 코어는 브라우저/Deno/엣지 런타임에서도 그대로 동작하도록 표준 API만 사용

## 코어 라이브러리 (`src/contrast.js`)
- `parseColor`: HEX(3/6자리), `rgb()` 파싱 및 입력 검증
- `linearize` / `relativeLuminance`: WCAG sRGB 선형화 + 상대 휘도
- `contrastRatio`: (L1+0.05)/(L2+0.05) 명암비
- `grade` / `checkContrast`: AA/AAA 등급 판정 (일반/큰 텍스트)

## 인터페이스
- CLI (`src/cli.js`): exit code로 CI 게이트 연동 (AA 실패 시 1)
- 향후 REST API: Hono(엣지) 또는 Fastify, 동일 코어 import
- 플러그인: Figma Plugin API + 동일 코어를 esbuild 번들

## 테스트
- Node 내장 러너 `node --test` (의존성 없이 `npm test` 실행)
- 검증 포인트: 흑백 21:1, 동일색 1:1, 알려진 경계값(#767676/white ≈ 4.54)

## 배포/운영
- 코어는 npm 패키지로 배포, API는 Cloudflare Workers/Vercel Edge
- 배치 검사는 큐(예: BullMQ) + 워커, 결과는 Postgres 저장

## 확장 로드맵
- APCA(WCAG 3 후보) 알고리즘 옵션 추가
- 색맹 시뮬레이션, 가장 가까운 합격 색상 탐색(델타E 기반)
- GitHub Action 패키징
