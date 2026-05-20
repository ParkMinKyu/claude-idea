# Tech Stack · 110 DB Schema Visualizer

## 런타임/언어
- **Node.js 20** — CLI + 라이브러리 + 서버리스 API
- **ESM**, `bin`으로 `schema-viz` CLI 노출

## DDL 파서
- **정규식 기반 자체 파서(의존성 0)** — CREATE TABLE 블록 추출 + 최상위 콤마 분할(괄호 인지)로 컬럼/제약 분리
- 인라인 FK(`REFERENCES`)와 테이블 레벨 FK 모두 인식, PK는 인라인/`PRIMARY KEY(...)` 둘 다 처리
- 풀스케일 SQL 파서(node-sql-parser) 대신 경량 파서를 채택해 빠르고 이식 쉬움(엣지/브라우저 가능). 복잡 방언은 상용에서 확장

## 그래프 모델
- `{ tables: [{ name, columns }], relations: [{ from, fromColumn, to, toColumn }] }`
- 렌더러 독립적 중간 표현 → DOT/Mermaid/JSON 등으로 변환

## 출력
- **Graphviz DOT** — record 노드 + 관계 엣지. GitHub/문서/CI에 임베드
- 상용: 인터랙티브 SVG(Mermaid/직접 렌더)로 줌/드래그

## 프론트엔드(상용)
- **Next.js 14** + **React Flow** 또는 **@hpcc-js/wasm**(Graphviz WASM)로 브라우저 렌더
- DB 연결 없이 텍스트 붙여넣기만으로 동작

## 동기화(상용)
- **GitHub App** — 마이그레이션 파일 변경 시 ERD 자동 갱신
- Team: 라이브 DB introspection(information_schema)

## 테스트
- **Vitest** — 다중 테이블, 컬럼/타입/NOT NULL, PK(인라인+테이블레벨), 인라인/테이블레벨 FK, DOT 출력, 빈 입력/주석 처리

## 선택 이유 요약
"SQL을 그대로 입력"하는 것이 차별점이라 전용 DSL을 배제하고 경량 DDL 파서를 직접 구현했다. DB 연결 없이 텍스트만으로 동작해 보안 부담을 없애고, 렌더러 독립적 그래프 모델로 다양한 출력(DOT/SVG)을 지원한다.
