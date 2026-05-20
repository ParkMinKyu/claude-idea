# 기술 스택 · 118 의존성 취약점 스캔

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI, `node:fs`)

## 코어 설계
- 의존성 0의 순수 함수 모듈 3개.
  - `src/lib/semver.ts` — parse/compare/coerce/satisfies(공백 구분 AND 비교기).
  - `src/lib/audit.ts` — `parseDependencies()`, `auditDependencies()`(주입형 DB 매칭),
    `summarize()`, `shouldFail()`(임계값 게이팅).
  - `src/lib/mock-db.ts` — advisory 피드를 흉내 낸 샘플 취약점 DB.
- DB를 인자로 주입해 외부 네트워크 없이 결정론적 테스트.

## CLI
- `src/index.ts` — package.json 경로와 `--fail-on <severity>`를 받아 결과 출력 + 종료 코드.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/semver.test.ts` — parse/compare/coerce/satisfies 경계.
- `tests/audit.test.ts` — 취약/패치/미등록 구분, 권고 메시지, 심각도 요약, 게이팅.
- 순수 함수 + 주입형 DB라 오프라인 검증.

## 빌드 / 배포
- npm 라이브러리 + bin(`depaudit`).
- Pro: 실제 advisory 피드(예: OSV/GHSA) 어댑터로 `mock-db`를 대체.

## 향후 확장
- lockfile 파싱으로 전이 의존성까지 정확 해석.
- OSV/GHSA 피드 동기화, SBOM(CycloneDX) 출력.
- 자동 패치 PR 생성 봇.
