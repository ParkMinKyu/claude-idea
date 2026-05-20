# TECH STACK · OG Image Generator

## 언어/런타임
- Node.js 22 (ESM)
- 코어(`src/og.js`)는 의존성 0 — SVG 문자열 생성은 순수 템플릿 로직
- 래스터화만 선택적 의존성(sharp/resvg)을 엣지에서 사용

## 코어 라이브러리 (`src/og.js`)
- `parseParams`: 쿼리 파라미터 검증/정규화(색상 `#` 보정, 사이즈 범위 200~4000)
- `escapeXml`: SVG 인젝션 방지
- `wrapText`: 폭 기반 자동 줄바꿈 + 줄 수 제한/말줄임
- `renderSvg` / `generate`: 템플릿별 SVG 출력

## 서버 (`src/server.js`)
- `node:http` 기반 최소 서버, `GET /og?...` → SVG
- `Cache-Control: public, max-age=86400`로 CDN 캐싱
- 동일 코어를 Vercel/Cloudflare Workers 핸들러로도 재사용 가능

## 래스터화 (엣지)
- `sharp`(libvips) 또는 `@resvg/resvg-js`로 SVG→PNG/JPEG
- 선택적 의존성으로 두어 SVG만 필요한 경우 가볍게 운영

## 테스트
- `node --test` (의존성 없이 `npm test` 실행)
- 검증 포인트: XML 이스케이프, 파라미터 검증, 줄바꿈/말줄임, 서버 핸들러

## 배포/운영
- Cloudflare Workers/Vercel Edge로 글로벌 캐싱
- 폰트 임베딩은 base64 또는 폰트 서브셋으로 콜드스타트 최소화
