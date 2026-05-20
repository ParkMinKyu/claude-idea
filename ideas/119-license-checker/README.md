# 119 · 라이선스 호환성 검사

## 개요
프로젝트 라이선스와 의존성 라이선스 간의 호환성을 SPDX 식별자 기반으로 판정하는 도구입니다.
permissive / weak-copyleft / strong-copyleft / proprietary 카테고리 분류와 단순화된 호환성
매트릭스로 `compatible / review / incompatible` 판정을 내립니다. 코어는 의존성 0의 순수 함수입니다.

## 문제
- 의존성 라이선스가 제품 배포 정책과 충돌하는지 수동 판단이 어렵습니다.
- GPL/AGPL 같은 강한 카피레프트가 무심코 들어와 법적 리스크가 됩니다.
- package.json의 라이선스 표기(별칭/대소문자)가 제각각이라 자동화가 까다롭습니다.

## 솔루션
- SPDX 카탈로그 + 별칭 정규화로 라이선스 식별을 표준화.
- 카테고리 기반 호환성 매트릭스로 방향성 있는(프로젝트←의존성) 판정.
- 프로젝트 단위 집계 + `passed` 플래그로 CI 게이팅.

## 타겟 사용자
- 법무/오픈소스 컴플라이언스 담당, 플랫폼 엔지니어.
- 상용 제품에 OSS를 통합하는 팀.
- 라이선스 정책을 CI로 강제하려는 조직.

## 핵심 기능
1. 라이선스 정규화 — SPDX 식별자 + 흔한 별칭/대소문자 처리.
   - `Apache 2.0`, `GPLv3`, `X11` 등 비표준 표기를 표준 ID로 매핑.
2. 카테고리 분류 — permissive/weak/strong copyleft/proprietary/unknown.
3. 호환성 판정 — 방향성 매트릭스로 compatible/review/incompatible.
   - 강한 카피레프트 의존성이 permissive/proprietary 프로젝트에 incompatible.
4. 프로젝트 감사 — 다중 의존성 집계, review/incompatible 카운트.
5. CI 게이팅 — incompatible 발생 시 종료 코드 1.

## 사용 예시
```bash
node src/index.ts MIT GPL-3.0 Apache-2.0 ISC
# XX GPL-3.0 [incompatible] ... / OK Apache-2.0 [compatible] ...
```
```ts
import { auditProject } from './lib/spdx';
const audit = auditProject('MIT', ['Apache-2.0', 'GPL-3.0']);
audit.passed; // false (GPL-3.0 incompatible)
```

## 도입 시나리오
- 상용 제품 빌드에서 GPL/AGPL 유입을 CI로 사전 차단.
- 의존성 라이선스 표기 난잡함을 정규화해 자동 분류.
- "review" 회색지대를 별도 보고해 법무 검토 큐로 전달.

## 수익 모델
- 오픈코어: 정규화 + 매트릭스 + CLI는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: CLI, 기본 카탈로그.
  - Pro ($25/월): 전체 SPDX 카탈로그, package.json/lock 자동 스캔, 정책 커스터마이즈.
  - Team ($99/월): 조직 정책, 예외 승인 워크플로, 컴플라이언스 리포트(SBOM 연동).

## 경쟁사
- license-checker(npm) — 수집만 하고 호환성 판정 없음.
- FOSSA / Snyk License — 강력하나 SaaS 종속·가격.
- ScanCode / OSS Review Toolkit — 정밀하나 무겁고 설정 복잡.

## 차별점
- 방향성 호환성 매트릭스로 "review" 회색지대까지 명확히 구분.
- 의존성 0 순수 코어 — 에어갭/CI에서 결정론적 판정.
- 별칭 정규화로 실제 package.json의 표기 난잡함을 흡수.
- 단순한 입력(라이선스 문자열)으로 어떤 의존성 소스와도 결합.

## KPI
- 스캔된 레포 수, 차단된 incompatible 빌드 수.
- 정책 커스터마이즈 사용률(Pro 신호).
- Free→Pro 전환율, 컴플라이언스 리포트 발급 수.
- review 항목 해소율(검토 워크플로 효율).

## 로드맵
- v0.1: 정규화 + 카테고리 + 호환성 매트릭스 + CLI(현재).
- v0.2: SPDX 표현식(AND/OR/WITH) 파싱.
- v0.3: package.json/lock 자동 스캔, 전이 의존성 분석.
- v1.0: 조직 정책 DSL, 예외 승인 워크플로(Team).
