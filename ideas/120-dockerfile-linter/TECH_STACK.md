# 기술 스택 · 120 Dockerfile 베스트프랙티스 검사

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI, `node:fs`)

## 코어 설계
- 의존성 0의 순수 함수 모듈 2개.
  - `src/lib/parser.ts` — `parseDockerfile()`로 명령/인자/라인번호 추출, 라인 연결(`\`)·주석 처리.
  - `src/lib/rules.ts` — `Rule` 함수 모음(`ALL_RULES`), `lint()`(라인순 정렬), `hasErrors()`(게이팅).
- 규칙을 `(Instruction[]) => LintViolation[]` 시그니처로 통일해 주입/확장 용이.

## 규칙(샘플)
- no-latest-tag, require-non-root-user, apt-cleanup, prefer-copy, first-instruction-from.
- 각 규칙은 hadolint의 DL 규칙을 단순화해 매핑.

## CLI
- `src/index.ts` — Dockerfile 경로와 `--fail-on <severity>`로 결과 출력 + 종료 코드.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/parser.test.ts` — 라인번호/주석/라인 연결/대문자화.
- `tests/rules.test.ts` — 각 규칙의 양/음성 케이스, 정렬, CI 게이팅.
- 순수 함수라 도커 데몬 없이 오프라인 검증.

## 빌드 / 배포
- npm 라이브러리 + bin(`dflint`).
- Pro: 확장 규칙 패키지와 자동 수정(autofix) 모듈을 코어 위에 구성.

## 향후 확장
- 멀티스테이지 빌드 의미 분석, 캐시 효율 규칙.
- autofix(규칙별 패치 생성)와 PR 코멘트 봇.
- 사용자 정의 규칙 플러그인 로더.
