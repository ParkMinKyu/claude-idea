# TECH STACK · 121 쿠버네티스 매니페스트 검증기

## 언어 / 런타임
- **Node.js 20+** (ESM) — CLI 배포가 쉽고 CI 러너에 기본 설치되어 있음
- TypeScript는 추후 도입 (현재 MVP는 순수 JS + JSDoc)

## 핵심 라이브러리
- **yaml** — 멀티 도큐먼트 YAML 파싱 (`parseAllDocuments`). 안전한 파서로 JS-YAML보다 라인/컬럼 정보 풍부
- 내장 규칙 엔진 — 외부 의존성 없는 순수 함수 모음

## 코어 아키텍처
- `src/parser.js` — YAML 문자열을 리소스 배열로 변환, 파싱 에러를 진단 객체로 정규화
- `src/rules.js` — 규칙 = `(resource) => Diagnostic[]` 형태의 순수 함수. 스키마 규칙과 베스트 프랙티스 규칙을 분리
- `src/validate.js` — 파서 + 규칙을 오케스트레이션, 점수 산출 및 리포트 생성
- `src/cli.js` — 파일 입력, exit code, JSON/텍스트 출력

## 테스트
- **vitest** — 빠른 ESM 친화 러너
- 순수 함수(파서, 규칙, 점수)를 네트워크/클러스터 없이 오프라인 테스트

## 규칙 분류
- `schema` — 필수 필드 누락 (error)
- `security` — privileged, hostNetwork, runAsRoot (error/warning)
- `reliability` — latest 태그, 리소스 limit 누락, replicas=1 (warning)

## 점수 모델
- 기본 100점에서 error -15, warning -5, info -1 차감 (하한 0)

## 배포 / 인프라 (프로덕션 계획)
- CLI: npm 패키지 + `npx` 실행
- SaaS: Vercel(대시보드) + Postgres(리포트 저장) + GitHub App(PR 코멘트)
- CI 통합: 공식 GitHub Action 래퍼 제공

## 확장 계획
- CRD 스키마를 OpenAPI에서 자동 수집
- 규칙 플러그인 레지스트리 (npm scope)
- Helm/Kustomize 렌더 결과 검증
