# 059 - JSON / YAML Diff Viewer

## 개요
두 JSON 또는 YAML 문서의 구조적 차이를 사람이 읽기 쉬운 형태로 시각화하는 웹 도구입니다. 순수 텍스트 diff(LineDiff)가 아닌 의미 단위 diff(키 추가/삭제/변경)로 비교하며, 큰 페이로드도 가상화 트리로 빠르게 탐색할 수 있습니다.

## 문제
- `diff` 명령어는 JSON의 키 순서 변경을 변경으로 표시 (오탐)
- 큰 API 응답을 비교하려면 수동으로 줄 정렬 필요
- YAML 들여쓰기 변경이 텍스트 diff에서 잡음으로 표시됨
- 팀에서 환경별 설정(prod/staging) 차이를 추적할 표준 도구 부재

## 솔루션
- 구조적 diff: 키 순서 무시, 의미 단위 변경 (added / removed / changed / same)
- Monaco 에디터 기반 좌/우 분할 뷰 + 시각적 마커
- JSON ↔ YAML 양방향 변환 후 비교
- 큰 페이로드 (1MB+) 가상화 트리
- URL 공유: `/d/{base64}`
- 팀 워크스페이스 (Pro): 환경 설정 영구 비교, 변경 알림

## 타겟
- 백엔드 개발자 (API 응답 비교)
- 데브옵스 (Kubernetes manifests, Helm values diff)
- QA (스냅샷 테스트 분석)
- 데이터 엔지니어 (스키마 진화)

## 핵심 기능
1. **구조적 diff**: deep-diff 알고리즘
2. **다중 형식**: JSON, YAML, TOML
3. **에디터**: Monaco (VS Code와 동일)
4. **무시 옵션**: 키 패턴, 값 패턴, 배열 순서
5. **공유 URL**: 영구 / 만료 옵션
6. **export**: patch (RFC 6902 JSON Patch), HTML 리포트
7. **CLI** (Pro): CI 통합 (PR 코멘트로 diff)
8. **환경 비교** (Pro): 영구 prod vs staging 모니터링

## 수익 모델
- **오픈코어**: 클라이언트 사이드 diff 엔진 MIT
- **Free**: 무제한 비교, 5MB 이하, 공유 24시간
- **Pro ($9/월)**: 영구 공유, 50MB, 환경 모니터링 3개
- **Team ($29/월, 5인)**: 무제한 환경, SSO, Slack 알림
- **Enterprise**: 셀프호스팅, 감사 로그

## 경쟁사
- jsondiff.com (기본, UI 구식)
- diffchecker.com (텍스트 diff 위주, 유료 광고 많음)
- jq + diff (CLI 조합, 학습 곡선)
- VS Code 확장 (로컬만)

## 차별점
- 의미 단위 diff (키 순서 무시) - 경쟁사 대부분 텍스트 diff
- Monaco 에디터 (1MB+ 페이로드 처리)
- JSON Patch export (자동화 친화)
- 환경 모니터링 (prod-staging drift 알림)
- 한글 / 다국어 UI

## KPI
- DAU, 일평균 비교 수
- 평균 페이로드 크기
- 공유 URL 클릭률
- Free → Pro 전환율 (목표 2%)
- CLI 다운로드 수
- 환경 모니터링 활성화 워크스페이스 수
