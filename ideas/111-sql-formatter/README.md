# 111 · SQL 포매터/린터

## 개요
SQL 쿼리를 일관된 스타일로 자동 정렬하고, 위험하거나 비효율적인 패턴을 정적으로 검출하는
개발자 도구입니다. 자체 토크나이저와 규칙 엔진으로 동작하며 외부 런타임 의존성이 없습니다.
CLI, 에디터 확장, CI 린트 단계에서 동일한 코어를 재사용할 수 있도록 순수 함수로 설계했습니다.

## 문제
- 팀마다 SQL 스타일이 제각각이라 코드 리뷰에서 포맷 논쟁이 반복됩니다.
- `SELECT *`, WHERE 없는 DELETE/UPDATE 같은 위험 패턴이 리뷰를 통과해 운영 사고로 이어집니다.
- 기존 포매터는 무겁거나 특정 방언에만 강하고, CI에 통합하기 번거롭습니다.

## 솔루션
- 가벼운 토크나이저로 SQL을 키워드/식별자/리터럴/연산자로 분해합니다.
- 절(clause) 단위 줄바꿈과 컬럼 들여쓰기를 적용해 결정론적이고 멱등한 출력을 만듭니다.
- 정적 린트 규칙으로 위험 패턴을 경고하고, CI에서 실패 코드로 차단할 수 있습니다.

## 타겟 사용자
- 백엔드/데이터 엔지니어와 분석가
- SQL 리뷰 표준을 강제하려는 플랫폼/DevEx 팀
- 마이그레이션 스크립트를 다루는 DBA

## 핵심 기능
1. SQL 토크나이저 — 키워드 대소문자 정규화, 문자열/주석/숫자 인식.
   - 손으로 작성한 스캐너로 의존성 없이 토큰 스트림 생성.
   - 두 단어 절 키워드(GROUP BY, ORDER BY 등)를 단일 논리 토큰으로 병합.
2. 절 단위 포매터 — SELECT/FROM/WHERE/JOIN/ORDER BY 자동 줄바꿈, 멱등 출력.
   - 같은 입력에 두 번 적용해도 결과가 변하지 않는 멱등성 보장.
3. 컬럼 리스트 들여쓰기 — 콤마 분리 컬럼을 정렬해 diff 가독성 향상.
4. 정적 린트 — `no-select-star`, `delete-without-where`, `update-without-where`, `keyword-case`.
   - 규칙별 식별자와 한국어 메시지로 명확한 피드백.
5. CLI — 파일/표준입력 포맷 + lint 결과 출력(CI 친화적 종료 코드).

## 사용 예시
```bash
# 파일 포맷
echo "select id,name from users where age>18" | npm run format

# pre-commit / CI 통합
git diff --name-only --cached | grep '\.sql$' | xargs -I{} sqlfmt {}
```
포매터는 `src/lib/formatter.ts`의 순수 함수로, 에디터 확장(웹)에서도 동일 코어를 임포트합니다.

## 도입 시나리오
- pre-commit 훅에서 자동 포맷으로 리뷰 diff 노이즈 제거.
- CI 린트 단계에서 위험 쿼리(WHERE 없는 DELETE 등) PR 차단.
- 에디터 확장에서 저장 시 포맷(format-on-save).

## 수익 모델
- 오픈코어: 토크나이저 + 기본 포맷/린트 규칙은 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: CLI, 기본 규칙, 단일 방언.
  - Team ($12/seat/월): 커스텀 규칙셋, 다중 방언(PostgreSQL/MySQL/BigQuery), GitHub PR 봇.
  - Enterprise ($1,500/월~): SSO, 온프레미스, 조직 정책 강제, 감사 로그.

## 경쟁사
- sqlfluff — 강력하지만 Python 기반, 설정이 무겁고 느림.
- sql-formatter(npm) — 포맷만 제공, 린트 부재.
- Prettier SQL 플러그인 — 방언 제한적.
- Datagrip 내장 포매터 — IDE 종속, CI 통합 불가.

## 차별점
- 의존성 0의 순수 코어 — 브라우저/엣지/CI 어디서나 동일 동작.
- 포맷과 린트를 한 코어에서 제공해 단일 패스로 처리.
- 멱등성 보장으로 "포맷 diff 노이즈" 제거, pre-commit 친화적.
- TypeScript 단일 패키지로 JS 생태계(에디터/번들러)에 자연스럽게 통합.

## KPI
- 주간 활성 CLI 실행 수, CI 통합 레포 수.
- Pro 전환율(Free→Team), seat 유지율.
- 린트 규칙으로 차단된 위험 쿼리 PR 수(가치 입증 지표).
- 에디터 확장 설치 수 및 format-on-save 활성 비율.

## 로드맵
- v0.1: 토크나이저 + 절 포맷 + 핵심 린트 규칙(현재).
- v0.2: 방언별 키워드 테이블(PostgreSQL/MySQL/BigQuery).
- v0.3: AST 기반 서브쿼리/CTE 정렬, GitHub Action 래퍼.
- v1.0: 에디터 확장(VS Code) 및 Pro 대시보드.
