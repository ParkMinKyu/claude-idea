# 기술 스택 · 112 실시간 로그 뷰어/필터

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (`node:readline`로 스트리밍 입력)

## 코어 설계
- 의존성 0의 순수 함수 모듈 2개.
  - `src/lib/parser.ts` — `parseLine()`/`parseLog()`로 JSON·텍스트 로그를 `LogEntry`로 정규화.
  - `src/lib/filter.ts` — 필터 DSL 토크나이저 + `parseQuery()` + `filterLogs()/matches()`.
- 레벨 순위표(`trace<debug<info<warn<error<fatal`)로 임계값 비교.

## CLI
- `src/index.ts` — `readline`으로 stdin 라인 스트림을 받아 파싱 후 쿼리 매칭, stdout 출력.
- `tail -f app.log | node src/index.ts "level>=warn -healthcheck"` 형태로 사용.

## 테스트
- Vitest 1.6 — TS 직접 실행, 추가 설정 없음.
- `tests/parser.test.ts`, `tests/filter.test.ts` — 파서·DSL 단위 테스트.
- 순수 함수라 파일/네트워크 없이 오프라인 수행.

## 빌드 / 배포
- npm 라이브러리 + bin(`logview`).
- 웹 라이브 테일 UI(Pro)는 동일 코어를 WebSocket/SSE 위에서 재사용.

## 향후 확장
- 멀티소스 수집기(파일/Docker/journald) 어댑터.
- 시간 윈도우/정규식 필드 추출 연산자 추가.
- 알림 규칙 엔진(임계값 초과 시 webhook).

## 디렉터리 구조
- `src/lib/` — 순수 코어(parser, filter).
- `src/index.ts` — 스트리밍 CLI 엔트리.
- `tests/` — parser/filter 단위 테스트.
