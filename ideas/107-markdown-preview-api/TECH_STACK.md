# Tech Stack · 107 Markdown Preview API

## 런타임
- **Node.js 20** — 표준 `http` 모듈로 의존성 최소 API 서버

## 마크다운 처리
- **marked 12** — 빠르고 GFM(테이블/체크박스/취소선) 지원하는 파서
- **sanitize-html 2** — 파싱 결과 HTML을 화이트리스트로 정화. DOMPurify(브라우저 의존) 대신 서버/Node 친화적인 sanitize-html 선택

## 보안 설계(핵심)
- **default-deny 화이트리스트** — 허용 태그/속성/스킴만 통과, 나머지 discard
- URL 스킴을 http/https/mailto로 제한 → `javascript:`/위험 `data:` 차단
- 모든 인라인 이벤트 핸들러(onerror 등) 제거
- 파싱과 정화를 분리해 파서 취약점이 출력으로 새지 않도록 함

## 부가 기능
- TOC: 정규식으로 헤딩 추출 + 한글 호환 슬러그 생성
- 요약문: 마크다운 문법 제거 후 길이 제한 plain-text

## API 서버
- **node:http**(데모/셀프호스팅), 상용은 **Hono on Cloudflare Workers**(엣지 저지연)
- 순수 함수 코어라 서버리스/엣지 이식 용이

## 캐시/과금(상용)
- **Cloudflare Cache** — 콘텐츠 해시 키로 렌더 결과 캐시
- **Stripe Billing** — 사용량 기반 구독

## 테스트
- **Vitest** — 기본 렌더, GFM 테이블, XSS(script/javascript:/onerror) 차단, TOC, 요약문
- 보안 회귀를 막기 위한 XSS 케이스를 1급 테스트로 유지

## 선택 이유 요약
"안전"이 제품의 가치 제안이므로 파서와 sanitizer를 분리하고 화이트리스트 default-deny를 채택했다. XSS 차단을 테스트로 고정해 회귀를 방지하며, 순수 함수 코어로 엣지 배포 저지연을 노린다.
