# 118 · 의존성 취약점 스캔

## 개요
`package.json`을 파싱해 의존성을 추출하고, 취약점 데이터베이스(advisory feed)와 버전 범위를
매칭해 위험 패키지를 찾아내는 의존성 감사 도구입니다. 자체 경량 semver 매처를 포함하며,
취약점 DB는 주입 가능(injectable)해 오프라인에서도 결정론적으로 테스트됩니다.

## 문제
- `npm audit`은 레지스트리 의존적이고 출력이 잡음 많아 CI 게이팅에 다루기 어렵습니다.
- 사내/에어갭 환경에서 외부 advisory 조회가 제한됩니다.
- 심각도 임계값 기반의 명확한 CI 실패 정책이 필요합니다.

## 솔루션
- deps/devDeps를 평탄화하고 범위를 구체 버전으로 coerce.
- semver 비교기(`>=1.0.0 <1.4.2` 등)로 취약 범위 매칭.
- 심각도 집계 + 임계값 기반 `shouldFail()`로 CI 게이팅, 패치 권고 제공.

## 타겟 사용자
- 보안/플랫폼 엔지니어, DevSecOps.
- 에어갭/사내 레지스트리 환경의 팀.
- 의존성 정책을 CI로 강제하려는 조직.

## 핵심 기능
1. package.json 파서 — deps/devDeps 평탄화, dev 플래그 구분.
2. 경량 semver 매처 — parse/compare/coerce/satisfies(AND 범위).
   - `^`,`~` 등 범위 연산자를 구체 버전으로 coerce 후 비교.
3. 취약점 매칭 — 주입형 DB와 범위 교차, 패치 가용성 판정.
   - 패치 존재 시 업그레이드 권고, 미존재 시 검토 권고 메시지.
4. 심각도 요약 — low/moderate/high/critical 집계 + 최고 심각도.
5. CI 게이팅 — `--fail-on` 임계값으로 종료 코드 제어.

## 사용 예시
```bash
node src/index.ts ./package.json --fail-on high
```
```ts
import { auditDependencies, parseDependencies } from './lib/audit';
import { MOCK_VULN_DB } from './lib/mock-db';
const findings = auditDependencies(parseDependencies(pkg), MOCK_VULN_DB);
```
취약점 DB를 인자로 주입하므로 사내/에어갭 피드로 교체해도 동일하게 동작합니다.

## 도입 시나리오
- CI에서 high 이상 취약점 발견 시 빌드 차단.
- 에어갭 환경에서 사내 advisory 피드로 오프라인 스캔.
- 패치 권고를 자동 PR로 변환(Pro)해 업그레이드 자동화.

## 수익 모델
- 오픈코어: 파서 + semver + 매칭 엔진 + CLI는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: CLI + 사용자 제공 DB.
  - Pro ($29/월): 큐레이션된 advisory 피드 동기화, 자동 PR 패치 제안.
  - Team ($120/월): 조직 정책, SBOM 생성, 라이선스 교차검사, 감사 리포트.

## 경쟁사
- npm audit — 레지스트리 의존, 잡음 많고 게이팅 제어 약함.
- Snyk / Dependabot — 강력하나 SaaS 종속·가격.
- OWASP Dependency-Check / Trivy — 무겁고 JS 워크플로 통합 번거로움.

## 차별점
- 주입형 DB — 에어갭/사내 피드로 외부 의존 없이 동작.
- 심각도 임계값 기반의 명확한 CI 실패 정책.
- 경량 순수 코어로 결정론적·테스트 가능한 매칭.
- JS/TS 단일 패키지로 npm 워크플로에 자연 통합.

## KPI
- 스캔된 레포 수, 차단된 취약 빌드 수.
- 자동 패치 PR 채택률(Pro 신호).
- Free→Pro 전환율, 피드 동기화 활성 수.
- 평균 스캔 시간(성능 지표).

## 로드맵
- v0.1: 파서 + semver + 주입형 DB 매칭 + CLI(현재).
- v0.2: lockfile 파싱으로 전이 의존성 정확 해석.
- v0.3: OSV/GHSA 피드 동기화, SBOM(CycloneDX) 출력.
- v1.0: 자동 패치 PR 봇, 라이선스 교차검사(Team).
