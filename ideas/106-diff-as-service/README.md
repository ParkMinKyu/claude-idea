# 106 · 텍스트 Diff API

## 개요
두 텍스트의 차이를 Myers O(ND) 알고리즘으로 계산해 ops/unified diff/통계로 반환하는 HTTP API. 문서·코드·설정 비교를 서비스로 외주화한다. 직접 구현/유지보수하기 번거로운 diff 로직을 API화한다.

## 문제
- diff는 모든 협업/버전관리 제품에 필요하지만, 정확한 Myers diff를 직접 구현하기 어렵고 엣지 케이스가 많다.
- 클라이언트 사이드 diff 라이브러리는 번들이 크고, 서버 일관성을 보장하기 어렵다.
- 대용량/멀티 포맷(라인/단어/문자) diff를 안정적으로 제공하는 API가 드물다.

## 솔루션
- 검증된 Myers O(ND) 알고리즘으로 최단 편집 스크립트를 계산한다.
- 라인 단위 diff를 ops 배열, unified diff 문자열, 통계로 동시에 제공한다.
- 순수 함수 코어라 서버/엣지/라이브러리 어디서나 동일 결과를 보장한다.
- 단어/문자 단위 diff, 3-way merge는 상용 플랜으로 확장한다.

## 타겟 사용자
- 문서/CMS에 버전 비교를 넣으려는 SaaS 개발자
- 코드 리뷰/감사 로그에 diff가 필요한 플랫폼 팀
- diff 구현을 외주화하고 싶은 인디 해커

## 핵심 기능
1. **Myers diff 코어** — O(ND) 시간복잡도, 임의 시퀀스(라인/토큰) 비교
2. **멀티 출력 포맷** — ops 배열, unified diff 문자열, 통계(추가/삭제/유지)
3. **HTTP API** — `POST /diff { old, new, format }`
4. **재구성 보장** — ops로 new 텍스트를 정확히 복원 가능(정합성)
5. **단어/문자 diff** — 커스텀 equals로 토큰 단위 비교(상용판)

## 수익 모델
오픈코어: Myers 코어 라이브러리는 MIT, 호스팅 API·고급 포맷은 SaaS.

| 플랜 | 가격 | 호출/월 | 포맷 | 최대 크기 |
|---|---|---|---|---|
| OSS | $0 | self-host | 라인 | 무제한 |
| Free | $0 | 5k | 라인 + unified | 100KB |
| Pro | $19/월 | 500k | + 단어/문자 diff | 5MB |
| Business | $79/월 | 10M | + 3-way merge | 50MB |

## 사용 시나리오
1. SaaS가 문서 버전 비교 기능에 Diff API를 호출한다.
2. `POST /diff`로 old/new 텍스트와 format을 보낸다.
3. 응답으로 ops 배열 또는 unified diff와 통계를 받는다.
4. 클라이언트는 ops로 변경 사항을 하이라이트해 렌더링한다.
5. 단어/문자 단위 diff가 필요하면 Pro 플랜으로 전환한다.

## 경쟁사
- **diff(npm) / jsdiff** — 클라이언트 라이브러리, 번들 부담·서버 일관성 이슈
- **diff-match-patch(Google)** — 강력하나 API/호스팅 미제공
- **GitHub diff** — 플랫폼 종속, 범용 텍스트 API 아님
- 대부분 정합성(ops 재구성) 보장을 명시하지 않음

## 차별점
- 정확한 Myers O(ND) 구현을 API로 제공 → 클라이언트 번들 0
- ops로 new 텍스트 정확 복원을 보장(정합성 테스트 포함)
- 순수 함수 코어로 서버/엣지/라이브러리 결과 일관성
- unified diff와 통계를 한 번의 호출로 동시 반환

## KPI
- API 호출량 및 P95 응답 시간(< 50ms for 100KB)
- diff 정합성 100%(ops 재구성 검증)
- Free → Pro 전환율 4% 이상
- OSS Star → API 가입 전환율
- 대용량(5MB) diff 성공률 99.9% 이상

## 로드맵
- v0: Myers 라인 diff + ops/unified/통계 + HTTP API(현재 MVP)
- v1: 단어/문자 단위 diff, prefix/suffix 트리밍 최적화
- v2: 3-way merge, patch 적용 API, 구문 인지 diff
- v3: 엣지 배포(글로벌 저지연), 팀 사용량 대시보드
