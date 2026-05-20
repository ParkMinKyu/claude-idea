# 기술 스택 · 111 SQL 포매터/린터

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI 및 테스트 실행)

## 코어 설계
- 의존성 0의 순수 함수 모듈(`src/lib/formatter.ts`).
  - `tokenize()` — 손으로 작성한 스캐너 기반 토크나이저.
  - `format()` — 절 단위 줄바꿈 + 콤마 컬럼 들여쓰기, 멱등 출력.
  - `lint()` — 정규식/토큰 기반 정적 규칙 엔진.
- 코어가 순수 함수이므로 브라우저(에디터 확장), 엣지 함수, CLI에서 재사용 가능.

## CLI
- `src/index.ts` — `node:fs`로 파일/표준입력을 읽어 포맷 출력, 린트 결과는 stderr.
- 배포 시 `tsc`로 빌드 후 npm bin으로 노출(`sqlfmt`).

## 테스트
- Vitest 1.6 — esbuild 변환으로 TS 직접 실행, 추가 설정 불필요.
- `tests/formatter.test.ts` — 토크나이저/포맷 멱등성/린트 규칙 단위 테스트.
- 순수 함수라 네트워크/DB 없이 오프라인에서 전 테스트 수행.

## 빌드 / 배포
- npm 패키지(라이브러리 + bin) 형태로 배포.
- Pro 기능(다중 방언, PR 봇)은 별도 비공개 패키지로 코어를 의존.

## 향후 확장
- 방언별 키워드 테이블 주입(PostgreSQL/MySQL/BigQuery).
- AST 단계 추가로 서브쿼리/CTE 정렬 고도화.
- GitHub Action 래퍼로 PR diff 코멘트 자동화.
