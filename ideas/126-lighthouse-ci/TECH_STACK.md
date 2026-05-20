# TECH STACK · 126 성능 측정 CI

## 언어 / 런타임
- **Node.js 20+** (ESM) — CI 러너 친화
- 코어 로직 외부 의존성 0 (실제 측정은 lighthouse 패키지를 옵션으로 호출)

## 코어 아키텍처
- `src/metrics.js` — Lighthouse/Web Vitals JSON에서 지표 추출 + 방향 메타데이터
- `src/assert.js` — 버짓 어서션 + baseline 회귀 검사 순수 함수
- `src/report.js` — 위반 목록 → 마크다운/요약
- `src/cli.js` — 결과 JSON + 설정 입력, exit code

## 지표 정의
- LCP(ms, lower-better), CLS(unitless, lower-better), TBT(ms, lower-better)
- performance score(0-1, higher-better)
- 각 지표에 `dir` 메타로 위반 방향 판정

## 어서션 모델
- budget: `{ metric, max?|min? }` → 절대 임계
- regression: baseline 대비 허용 변화율 `tolerance`(%) 초과 시 위반
- 두 검사를 합쳐 위반 배열 반환, 하나라도 있으면 실패

## 테스트
- **vitest** — 픽스처 JSON으로 추출·버짓·회귀 로직을 측정 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- 측정: GitHub Actions에서 lighthouse 실행 → JSON 산출
- baseline 저장: Cloud(S3/Postgres)에 main 브랜치 결과 보관
- PR 코멘트: GitHub App

## 확장 계획
- 다중 URL/페이지 평균
- 통계적 유의성(여러 회 측정 분산 고려)
- 추이 그래프 대시보드
