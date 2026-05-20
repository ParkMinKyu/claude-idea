# 109 · 셀프호스팅 GraphQL IDE

## 개요
GraphQL 엔드포인트에 introspection을 수행해 스키마를 탐색하고, 쿼리를 작성·실행할 수 있는 셀프호스팅 IDE. 스키마를 IDE 친화적 모델로 평탄화해 자동완성·문서 탐색을 제공한다. GraphiQL/Apollo Sandbox의 온프렘 대안을 지향한다.

## 문제
- 사내 GraphQL API를 탐색할 때 외부 호스팅 IDE(Apollo Studio 등)에 스키마를 노출하기 부담스럽다.
- introspection 결과는 깊게 중첩되어(NON_NULL/LIST 래퍼) 그대로 UI에 쓰기 어렵다.
- 팀 단위로 쿼리 히스토리/공유/권한을 관리할 셀프호스팅 도구가 부족하다.

## 솔루션
- SDL 또는 라이브 엔드포인트에 표준 introspection 쿼리를 실행한다.
- 중첩된 타입 래퍼를 `[Post!]!` 같은 읽기 쉬운 표기로 평탄화한다.
- 타입/필드/인자/enum을 IDE가 바로 렌더링할 모델로 변환한다.
- 온프렘 배포로 스키마가 외부로 나가지 않는다.

## 타겟 사용자
- 내부 GraphQL API를 운영하는 백엔드 팀
- 보안상 외부 IDE 사용이 금지된 조직
- GraphQL 학습/온보딩이 필요한 신규 개발자

## 핵심 기능
1. **introspection 실행** — SDL 빌드 + 표준 introspection 쿼리
2. **타입 모델 평탄화** — NON_NULL/LIST 래퍼를 `[T!]!` 표기로 변환, 인자/enum 포함
3. **스키마 탐색기** — 타입 검색, 필드/인자 문서 뷰
4. **쿼리 실행기** — `POST /graphql`로 변수 포함 실행
5. **쿼리 공유/히스토리** — 팀 단위 저장·공유(상용판)

## 수익 모델
오픈코어: introspection 파서 + IDE 코어는 MIT, 팀 협업·권한·SSO는 SaaS/Enterprise.

| 플랜 | 가격 | 엔드포인트 | 히스토리 | 팀 |
|---|---|---|---|---|
| OSS (self-host) | $0 | 무제한 | 로컬 | - |
| Free (cloud) | $0 | 1 | 7일 | 1명 |
| Team | $25/월 | 10 | 90일 + 공유 | 10명 |
| Enterprise | 협의 | 무제한 | 무제한 | SSO + 권한 + 감사 |

## 사용 시나리오
1. 팀이 사내 GraphQL 엔드포인트를 IDE에 등록한다(온프렘).
2. IDE가 introspection을 실행해 스키마를 평탄 모델로 로드한다.
3. 개발자는 타입/필드/인자를 탐색하며 쿼리를 자동완성으로 작성한다.
4. 변수와 함께 쿼리를 실행하고 결과를 확인한다.
5. 유용한 쿼리를 팀과 공유하거나 히스토리에서 재실행한다(Team).

## 경쟁사
- **GraphiQL** — 표준 임베드용, 팀 협업/권한 없음
- **Apollo Sandbox/Studio** — 강력하나 클라우드 종속(스키마 노출 우려)
- **Altair / Insomnia** — 데스크톱 클라이언트, 팀 셀프호스팅 약함
- **Postman GraphQL** — 범용 API 툴, GraphQL 특화 탐색 약함

## 차별점
- introspection 결과를 IDE 친화 모델로 평탄화해 자동완성 구현 비용 절감
- 완전 셀프호스팅 → 내부 스키마 외부 노출 없음(보안 셀링 포인트)
- 파서 코어가 graphql 표준만 의존 → 가볍고 이식 쉬움
- 팀 권한/공유를 온프렘에서 지원

## KPI
- 셀프호스팅 배포 수 및 OSS Star
- 쿼리 실행 수 / 활성 사용자
- Free → Team 전환율 5% 이상
- introspection 파싱 정확도 100%(타입 래퍼 포함)
- 스키마 로드 시간 < 500ms(대형 스키마)

## 로드맵
- v0: introspection 실행 + 타입 모델 평탄화 + 쿼리 실행 백엔드(현재 MVP)
- v1: CodeMirror 자동완성, 스키마 탐색기 UI, 라이브 엔드포인트 프록시
- v2: 쿼리 히스토리/공유, 팀 워크스페이스, 헤더/인증 프리셋
- v3: 권한/역할, SSO, 감사 로그(Enterprise)
