# 110 · DB 스키마 ERD 생성기

## 개요
SQL DDL(CREATE TABLE)을 파싱해 테이블·컬럼·관계를 그래프 모델로 만들고 ERD(Graphviz DOT)로 시각화하는 도구. 마이그레이션 파일이나 스키마 덤프를 붙여넣으면 즉시 다이어그램이 나온다. dbdiagram.io의 SQL-퍼스트·셀프호스팅 대안을 지향한다.

## 문제
- 팀이 커지면 DB 스키마 전체 구조를 파악하기 어렵고, 문서화된 ERD가 코드와 어긋난다.
- 기존 ERD 도구는 전용 DSL을 요구하거나(dbdiagram), DB에 직접 연결해야 해 보안 부담이 있다.
- 마이그레이션 SQL에서 외래 키 관계를 손으로 추적하는 것은 오류가 잦다.

## 솔루션
- 표준 SQL DDL을 파싱해 테이블/컬럼/PK/FK를 추출한다.
- 인라인 FK(`REFERENCES`)와 테이블 레벨 FK(`FOREIGN KEY ... REFERENCES`)를 모두 인식한다.
- 결과를 그래프 모델(JSON)과 Graphviz DOT로 출력해 어디서나 렌더링한다.
- DB 연결 없이 SQL 텍스트만으로 동작 → 운영 DB 접근 불필요.

## 타겟 사용자
- 스키마 문서화가 필요한 백엔드 팀
- 신규 합류자 온보딩을 돕는 테크리드
- DB 연결 없이 ERD를 원하는 보안 민감 조직

## 핵심 기능
1. **DDL 파서** — CREATE TABLE, 컬럼 타입, NOT NULL, PK(인라인/테이블 레벨)
2. **관계 추출** — 인라인 FK + 테이블 레벨 FK → from/to 관계 그래프
3. **그래프 모델** — 테이블·컬럼·관계를 JSON으로 구조화
4. **DOT 출력** — Graphviz record 노드 + 관계 엣지로 ERD 생성
5. **CLI** — `schema-viz schema.sql --dot`

## 수익 모델
오픈코어: 파서 + DOT 출력 코어는 MIT, 인터랙티브 다이어그램·동기화·협업은 SaaS.

| 플랜 | 가격 | 스키마 | 동기화 | 협업 |
|---|---|---|---|---|
| OSS | $0 | self-host | 수동 | - |
| Free | $0 | 3 | - | 1명 |
| Pro | $15/월 | 무제한 | Git 마이그레이션 자동 동기화 | 3명 |
| Team | $49/월 | 무제한 | + DB introspection | 15명 + SSO |

## 사용 시나리오
1. 개발자가 마이그레이션 SQL 또는 스키마 덤프를 붙여넣는다.
2. 파서가 테이블/컬럼/PK/FK를 추출해 그래프 모델을 만든다.
3. `schema-viz schema.sql --dot`으로 Graphviz DOT를 생성한다.
4. DOT를 렌더해 ERD를 README/문서/CI 아티팩트에 임베드한다.
5. CI에서 스키마 변경 시 ERD를 자동 갱신한다(Pro).

## 경쟁사
- **dbdiagram.io** — 인기 있으나 전용 DSL(DBML) 필요, 코드와 어긋날 수 있음
- **DrawSQL** — 협업 강점, 수동 작성 위주
- **dbdocs.io** — DBML 기반 문서화, SQL 직접 입력 약함
- **SchemaSpy** — 강력하나 DB 연결 필수, 무거움
- **Mermaid ERD** — 임베드 쉬우나 수기 작성

## 차별점
- 전용 DSL이 아닌 실제 SQL DDL을 입력으로 사용 → 마이그레이션과 항상 일치
- DB 연결 불필요(텍스트만) → 보안 부담 없음, CI에서 ERD 자동 생성
- 인라인/테이블 레벨 FK를 모두 정확히 파싱
- DOT 출력으로 GitHub README, 문서, CI 아티팩트에 임베드 용이

## KPI
- 파싱 정확도(테이블/관계 추출률 > 98%, 주요 방언)
- CLI/CI 통합 repo 수 및 OSS Star
- Free → Pro 전환율 4% 이상
- 스키마 입력 → ERD 생성까지 시간 < 5초
- 다이어그램 임베드/공유 수

## 로드맵
- v0: DDL 파서 + 관계 추출 + DOT 출력 + CLI(현재 MVP)
- v1: 웹 UI(인터랙티브 SVG), 더 많은 SQL 방언(MySQL/Postgres 차이)
- v2: Git 마이그레이션 자동 동기화, 인덱스/제약 표시
- v3: 라이브 DB introspection, 팀 협업, SSO
