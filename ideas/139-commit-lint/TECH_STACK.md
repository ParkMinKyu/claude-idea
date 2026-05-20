# TECH STACK · Commit Lint

## 언어/런타임
- Node.js 22 (ESM), 의존성 0
- 정규식 + 문자열 파싱만 사용 → 훅/CI/엣지 어디서나 동작

## 코어 라이브러리 (`src/lint.js`)
- `parseCommit`: 헤더(type/scope/!/subject), 본문, 푸터 구조화 파싱
- BREAKING CHANGE 탐지(`!` 및 `BREAKING CHANGE:` 푸터)
- `lintCommit`: 타입 화이트리스트, 헤더 길이, scope 필수, subject 케이스/마침표
- 머지 커밋 자동 스킵, 오류/경고 분리

## CLI (`src/cli.js`)
- `node src/cli.js .git/COMMIT_EDITMSG` → commit-msg 훅으로 사용
- 위반 시 exit 1, 통과 시 0

## 통합
- husky `commit-msg` 훅 또는 `core.hooksPath`로 설치
- GitHub Action: PR의 커밋들을 일괄 검사 + 코멘트
- semantic-release와 결합해 자동 버전/changelog

## 테스트
- `node --test` (의존성 없이 `npm test`)
- 검증 포인트: 파싱(scope/breaking/footer), 규칙(타입/길이/scope), 머지 스킵

## 확장 로드맵
- 규칙셋 YAML/JSON 외부화, 조직 공유 프리셋
- PR 코멘트 봇, 위반 통계 대시보드
- 커스텀 타입/scope enum 정의
