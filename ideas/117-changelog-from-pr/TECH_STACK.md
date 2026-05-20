# 기술 스택 · 117 PR에서 체인지로그 생성

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI)

## 코어 설계
- 의존성 0의 순수 함수 모듈(`src/lib/changelog.ts`).
  - `parseChange()` — Conventional Commits 정규식 파싱, PR 번호 suffix 추출, 별칭 매핑.
  - `generateChangelog()` — 카테고리 그룹화, 고정 섹션 순서, 브레이킹 최상단 렌더.
- `TYPE_MAP`/`SECTION_ORDER` 테이블로 분류·렌더 규칙을 데이터 주도로 관리.

## CLI
- `src/index.ts` — stdin으로 제목 라인을 받아 `--version` 옵션과 함께 마크다운 출력.
- `git log --pretty=%s v1.0.0..HEAD | node src/index.ts --version 1.1.0` 형태.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/changelog.test.ts` — 파서(scope/PR/breaking/별칭/폴백), 생성기(섹션 순서/브레이킹/필터/기본 버전).
- 순수 함수라 git/네트워크 없이 결정론적 검증.

## 빌드 / 배포
- npm 라이브러리 + bin(`prchlog`).
- Pro 기능(GitHub Release 게시)은 코어를 의존하는 Action/봇으로 분리.

## 향후 확장
- GitHub API 연동으로 PR 라벨/작성자 기반 분류.
- 모노레포 패키지별 체인지로그 분리(changesets 호환).
- 커스텀 템플릿(핸들바) 및 i18n 섹션 제목.

## 디렉터리 구조
- `src/lib/changelog.ts` — 파서 + 생성기(순수 함수).
- `src/index.ts` — stdin 기반 CLI 엔트리.
- `tests/` — 파서/생성기 단위 테스트.
