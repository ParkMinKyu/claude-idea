# Tech Stack · 109 GraphQL Playground

## 런타임
- **Node.js 20** — introspection 실행 + 쿼리 프록시 백엔드

## GraphQL 처리
- **graphql 16(graphql-js)** — `buildSchema`, `getIntrospectionQuery`, `graphqlSync`로 표준 introspection 수행. 비표준 파서 대신 레퍼런스 구현 사용으로 정확성 확보
- introspection 결과의 NON_NULL/LIST 래퍼를 재귀 평탄화해 `[T!]!` 표기 생성

## 모델 설계
- 타입/필드/인자/enum을 IDE가 바로 쓰는 평탄 모델로 변환
- 내장 `__` 타입 제외, baseType과 렌더 문자열을 함께 제공해 자동완성 용이

## 프론트엔드(IDE)
- **Next.js 14** + **React 18**
- **CodeMirror 6** + GraphQL 언어 모드 — 자동완성/문법 강조(평탄 모델 기반)
- 스키마 탐색기: 타입 그래프 + 필드 문서

## 백엔드
- **node:http** — `/schema`(모델), `/graphql`(실행) 데모 서버
- 라이브 엔드포인트 프록시: introspection을 캐시해 반복 조회 비용 절감

## 데이터(상용)
- **PostgreSQL** — 쿼리 히스토리/공유/권한
- **Clerk** + **SSO(SAML)** — 팀/엔터프라이즈 인증

## 인프라
- 셀프호스팅: 단일 컨테이너 이미지(클라우드와 동일)
- 클라우드: **Fly.io** + **Neon**

## 테스트
- **Vitest** — introspection 실행, 모델 평탄화(필드/인자/enum/래퍼), 잘못된 SDL 거부, typeRefToString 재귀

## 선택 이유 요약
정확성을 위해 introspection은 graphql-js 레퍼런스 구현에 위임하고, 차별점인 "IDE 친화 모델 평탄화"에 자체 로직을 집중했다. 셀프호스팅으로 스키마 프라이버시를 보장한다.
