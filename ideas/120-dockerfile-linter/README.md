# 120 · Dockerfile 베스트프랙티스 검사

## 개요
Dockerfile을 파싱해 명령(instruction) 단위로 분석하고, 보안·이미지 크기·재현성 관련
베스트프랙티스 규칙을 검사하는 린터입니다. 라인 연결(`\`), 주석, ARG 우선 처리를 다루며,
코어는 의존성 0의 순수 함수라 CI와 로컬에서 동일하게 동작합니다.

## 문제
- 잘못된 Dockerfile 관행(latest 태그, root 실행, apt 캐시 잔존)이 이미지 크기·보안에 악영향.
- hadolint는 강력하지만 바이너리 설치/환경 구성이 번거롭고 커스터마이즈가 제한적.
- 팀 내부 규칙을 코드로 강제하기 어렵습니다.

## 솔루션
- 라인 연결과 주석을 처리하는 파서로 명령/인자/라인번호를 추출.
- 함수형 규칙(Rule) 모음으로 위반을 수집하고 라인순 정렬.
- 심각도 임계값 기반 `hasErrors()`로 CI 게이팅.

## 타겟 사용자
- 플랫폼/DevOps 엔지니어, 컨테이너 빌드 담당.
- 이미지 보안·크기 최적화를 표준화하려는 팀.
- 사내 규칙을 코드로 강제하려는 DevEx 팀.

## 핵심 기능
1. Dockerfile 파서 — 명령/인자/라인번호, 라인 연결·주석 처리.
   - `\` 라인 연결을 단일 명령으로 병합해 멀티라인 RUN 정확 분석.
2. 베스트프랙티스 규칙 — latest 금지, 비루트 USER, apt 정리, COPY 권장, FROM 우선.
   - hadolint의 DL 규칙을 단순화해 매핑, 다이제스트 핀은 예외 처리.
3. 심각도 분류 — info/warning/error, 라인순 정렬 출력.
4. CI 게이팅 — `--fail-on` 임계값으로 종료 코드 제어.
5. 확장 가능한 규칙 API — 사용자 규칙 함수 주입.

## 사용 예시
```bash
node src/index.ts ./Dockerfile --fail-on warning
# Dockerfile:1 [warning] no-latest-tag: FROM 이미지에 명시적 버전 태그를 고정하세요 ...
```
```ts
import { parseDockerfile } from './lib/parser';
import { lint } from './lib/rules';
const violations = lint(parseDockerfile(text));
```

## 도입 시나리오
- CI에서 warning 이상 위반 시 빌드 차단으로 이미지 품질 표준화.
- 사내 규칙(예: 특정 베이스 이미지 강제)을 규칙 함수로 추가.
- 멀티라인 RUN의 apt 캐시 잔존 같은 크기 낭비를 사전 검출.

## 수익 모델
- 오픈코어: 파서 + 기본 규칙 + CLI는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: CLI, 기본 규칙셋.
  - Pro ($15/월): 확장 규칙셋, 자동 수정 제안, GitHub PR 코멘트 봇.
  - Team ($59/월): 조직 규칙 정책, 멀티스테이지 분석, 컴플라이언스 리포트.

## 경쟁사
- hadolint — 강력하나 Haskell 바이너리 설치 필요, 커스터마이즈 제한.
- dockerfilelint — 규칙이 적고 유지보수 정체.
- Trivy config / Checkov / Snyk IaC — IaC 전반 대상, Dockerfile 특화 약함.

## 차별점
- 의존성 0 순수 코어 — 바이너리 설치 없이 어디서나 실행.
- 함수형 규칙 API로 사내 규칙을 쉽게 추가/구성.
- 라인 연결 처리로 멀티라인 RUN까지 정확히 분석.
- JS/TS 패키지로 npm 기반 CI에 자연 통합.

## KPI
- 린트된 Dockerfile/레포 수, 차단된 위반 빌드 수.
- 자동 수정 제안 채택률(Pro 신호).
- Free→Pro 전환율, 사용자 정의 규칙 사용 수.
- 평균 위반 수 감소 추이(개선 효과 지표).

## 로드맵
- v0.1: 파서 + 핵심 규칙 + CLI(현재).
- v0.2: 확장 규칙셋, 멀티스테이지 빌드 의미 분석.
- v0.3: autofix(규칙별 패치 생성), PR 코멘트 봇.
- v1.0: 조직 규칙 정책, 컴플라이언스 리포트(Team).
