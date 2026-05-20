# 117 · PR에서 체인지로그 생성

## 개요
커밋/PR 제목을 Conventional Commits 규칙으로 파싱해 분류하고, 섹션별로 정렬된 마크다운
체인지로그를 자동 생성하는 도구입니다. 외부 API 없이 제목 텍스트만으로 동작하며, 코어는
의존성 0의 순수 함수라 CI와 로컬에서 동일하게 실행됩니다.

## 문제
- 릴리스마다 체인지로그를 손으로 정리하는 데 시간이 많이 듭니다.
- 커밋 메시지 규칙이 있어도 분류/포맷이 사람마다 달라집니다.
- 브레이킹 체인지가 눈에 띄지 않아 사용자에게 누락 전달됩니다.

## 솔루션
- `type(scope)!: description (#PR)` 형태를 파싱해 카테고리/스코프/PR번호/브레이킹 추출.
- feature/fix/perf/docs 등 표준 섹션으로 그룹화하고 정해진 순서로 렌더링.
- 브레이킹 체인지를 최상단 별도 섹션으로 강조.

## 타겟 사용자
- 릴리스 매니저, 오픈소스 메인테이너.
- 잦은 릴리스를 자동화하려는 제품 엔지니어링 팀.
- CI 파이프라인에 릴리스 노트를 통합하려는 DevEx 팀.

## 핵심 기능
1. Conventional Commits 파서 — type/scope/breaking/PR번호 추출, 별칭(perf/ci/bugfix) 매핑.
   - `type(scope)!: description (#PR)` 형식을 정규식으로 분해.
2. 카테고리 분류 — 9개 표준 섹션 매핑, 미준수 제목은 Other로.
3. 브레이킹 강조 — `!` 또는 `BREAKING CHANGE` 감지 후 최상단 섹션.
4. 마크다운 렌더 — 섹션 순서 고정, 스코프 볼드, PR 링크 형식.
5. CLI — `git log --pretty=%s` 출력을 파이프해 즉시 생성.

## 사용 예시
```bash
# git 히스토리에서 체인지로그 생성
git log --pretty=%s v1.0.0..HEAD | node src/index.ts --version 1.1.0
```
```ts
import { generateChangelog } from './lib/changelog';
generateChangelog(['feat(ui): add dark mode (#10)', 'fix: crash (#11)'], { version: '2.0.0' });
```

## 도입 시나리오
- 릴리스 태깅 시 CI가 자동으로 릴리스 노트 초안 생성.
- PR 머지 제목을 그대로 분류해 수작업 정리 제거.
- 브레이킹 체인지를 최상단에 강조해 사용자 공지 누락 방지.

## 수익 모델
- 오픈코어: 파서 + 생성기 + CLI는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: CLI, 로컬 생성.
  - Pro ($15/월): GitHub Release 자동 게시, PR 라벨 기반 분류, 템플릿.
  - Team ($59/월): 모노레포 다중 패키지, 승인 워크플로, 조직 템플릿.

## 경쟁사
- conventional-changelog — 설정이 복잡하고 플러그인 의존.
- release-please / semantic-release — 강력하나 워크플로 종속·러닝커브.
- changesets — 모노레포 특화, 수동 changeset 작성 필요.

## 차별점
- 의존성 0 코어 — 제목만으로 동작, git 히스토리/네트워크 불필요.
- 브레이킹 체인지 최상단 강조로 가시성 확보.
- 카테고리 필터/순서 커스터마이즈가 쉬운 순수 함수 API.
- 입력이 단순 문자열 배열이라 어떤 소스(PR API/git)와도 결합 가능.

## KPI
- CLI 실행 수, 자동 생성된 릴리스 노트 수.
- GitHub Release 자동 게시 연동 수(Pro 신호).
- Free→Pro 전환율, 모노레포 연동 수.
- Conventional Commits 준수율(파싱 성공 비율).

## 로드맵
- v0.1: 파서 + 분류 + 마크다운 생성 + CLI(현재).
- v0.2: GitHub API 연동(PR 라벨/작성자 기반 분류).
- v0.3: 커스텀 템플릿, i18n 섹션 제목.
- v1.0: 모노레포 패키지별 생성, 자동 Release 게시(Team).
