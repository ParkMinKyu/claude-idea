# TECH STACK · 129 API 변경 추적/알림

## 언어 / 런타임
- **Node.js 20+** (ESM) — JSON/YAML 처리 및 CI 친화
- 코어 diff 로직 외부 의존성 0 (YAML 입력 시 `yaml` 옵션 사용)

## 코어 아키텍처
- `src/diff.js` — 두 OpenAPI 객체(JSON)를 비교해 변경 항목 배열 생성하는 순수 함수
- `src/classify.js` — 변경 항목을 breaking/non-breaking/info로 분류하는 규칙
- `src/changelog.js` — 분류 결과 → 마크다운 변경 로그 + semver 제안
- `src/cli.js` — old/new 스펙 파일 입력, exit code

## diff 범위 (MVP)
- paths: 추가/삭제
- operations(method): 추가/삭제
- parameters: 추가/삭제, required 여부 변화
- responses: 상태코드 추가/삭제
- (간이) 요청 본문 required 변화

## 분류 규칙 (breaking 예)
- 엔드포인트/오퍼레이션 삭제
- 필수 요청 파라미터 추가
- 기존 성공 응답(2xx) 제거
- 응답 스키마 필드 제거(확장 예정)
non-breaking: 새 엔드포인트, 선택 파라미터 추가, 새 응답 코드 등

## 테스트
- **vitest** — old/new 스펙 픽스처로 diff 추출과 breaking 분류를 네트워크 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- CLI: npm 패키지
- SaaS: 변경 이력 저장(Postgres) + 외부 스펙 폴링 워커
- PR 코멘트: GitHub App

## 확장 계획
- 스키마(필드/타입) 깊은 비교
- 시맨틱 버전 자동 제안 정교화
- 외부 API 모니터링 + 다채널 알림
