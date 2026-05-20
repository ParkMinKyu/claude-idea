# 기술 스택 · 119 라이선스 호환성 검사

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI)

## 코어 설계
- 의존성 0의 순수 함수 모듈(`src/lib/spdx.ts`).
  - `CATALOG`/`ALIASES` — SPDX 식별자 카탈로그와 흔한 별칭 테이블.
  - `normalizeLicense()` / `getLicense()` — 표기 정규화 + 카테고리 분류.
  - `checkCompatibility()` — 방향성 호환성 매트릭스(프로젝트←의존성).
  - `auditProject()` — 다중 의존성 집계, `passed` 게이팅 플래그.
- 규칙을 카테고리 단위로 단순화해 유지보수와 테스트 용이.

## CLI
- `src/index.ts` — `<projectLicense> <depLicense...>`를 받아 판정 출력 + 종료 코드.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/spdx.test.ts` — 별칭/대소문자 정규화, 카테고리, 호환성 4방향, 프로젝트 집계.
- 순수 함수라 오프라인 결정론적 검증.

## 빌드 / 배포
- npm 라이브러리 + bin(`licheck`).
- Pro: package.json/lockfile 스캐너와 전체 SPDX 데이터셋 어댑터 추가.

## 향후 확장
- SPDX 표현식(AND/OR/WITH) 파싱.
- package.json/lock 자동 수집 및 전이 의존성 분석.
- 조직 정책 DSL과 예외 승인 워크플로.
