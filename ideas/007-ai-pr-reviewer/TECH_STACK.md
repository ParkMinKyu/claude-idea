# 기술 스택

## Runtime
- **Node.js 20 + TypeScript**: GitHub App SDK(probot/octokit) 풍부, 웹훅 처리 표준
- **probot**: GitHub App 보일러플레이트, 웹훅 라우팅

## Backend
- **probot 앱 서버**: PR opened/synchronize 이벤트 수신
- **@octokit/rest**: GitHub API 호출 (PR diff 가져오기, 코멘트 생성)
- **@anthropic-ai/sdk**: LLM 호출

## LLM
- **Claude (claude-opus-4-7)**: 코드 리뷰는 추론 깊이 중요 → opus
- diff가 크면 파일별로 분할 호출 → 비용 통제

## Storage
- **MVP**: 무상태 (각 PR 이벤트 1회성 처리)
- **Phase 2**: Postgres — 설치/사용량/코멘트 피드백 저장

## 배포
- **Fly.io / Render**: 항상 켜져 있는 웹훅 수신 서버
- **GitHub App**: 마켓플레이스 등록

## 보안
- 웹훅 시그니처 검증 (GitHub secret)
- 사용자 코드는 로깅하지 않음
- 토큰은 GitHub App installation token (단기 유효)

## 선택 이유 요약
- probot이 GitHub App 패턴을 표준화 — 빠른 셋업
- TypeScript + Octokit 조합이 GitHub API 사용에 가장 안정적
- Claude opus는 버그 탐지 정확도가 sonnet 대비 명확히 우수 (자체 벤치마크)
