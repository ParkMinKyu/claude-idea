# TECH STACK · 124 DNS 전파 체커

## 언어 / 런타임
- **Node.js 20+** (ESM) — 내장 `dns` 모듈로 resolver 지정 조회 가능
- 코어 로직은 외부 의존성 0

## 코어 아키텍처
- `src/compare.js` — resolver 응답 배열을 정규화/비교/전파율 계산하는 순수 함수
- `src/resolvers.js` — 공개 resolver 목록 + 내장 `dns.Resolver`로 조회하는 I/O 레이어 (주입형)
- `src/check.js` — 여러 resolver 결과 수집 + 비교 결과 합성
- `src/cli.js` — 도메인/타입 입력, 텍스트/JSON 출력

## DNS 조회
- `new dns.promises.Resolver()` 인스턴스별 `setServers([resolverIP])`로 특정 resolver 지정
- 타입별 메서드: `resolve4`, `resolve6`, `resolveCname`, `resolveMx`, `resolveTxt`, `resolveNs`

## 비교 로직
- 각 resolver 응답을 정렬·문자열화해 그룹 키로 사용
- 전파율 = (기대값과 일치하는 resolver 수) / (성공 resolver 수)
- 기대값 미지정 시 다수결(majority) 값을 기준으로 사용

## 테스트
- **vitest** — 가짜 resolver 응답으로 정규화·전파율·불일치 그룹핑을 네트워크 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- 글로벌 엣지(Cloudflare Workers / 멀티 리전 람다)에서 분산 조회
- 결과 캐시: Redis (TTL 기반)
- 웹 UI: Next.js + Vercel

## 확장 계획
- 모니터링 모드 (기대값 도달까지 폴링 후 알림)
- DNSSEC 검증
- resolver 지리 위치 표시 (지도 시각화)
