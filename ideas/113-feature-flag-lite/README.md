# 113 · 경량 피처 플래그

## 개요
복잡한 인프라 없이 코드에 바로 임베드할 수 있는 경량 피처 플래그 SDK입니다. 결정론적
버킷팅으로 점진적 롤아웃을 지원하고, 속성 기반 규칙(AND 조건)으로 타겟팅합니다. 평가
엔진은 의존성 0의 순수 함수라 서버/엣지/브라우저 어디서나 동일하게 평가됩니다.

## 문제
- LaunchDarkly급 솔루션은 작은 팀에 과하고 비쌉니다.
- 환경변수 기반 토글은 점진적 롤아웃·타겟팅·감사가 불가능합니다.
- 자체 구현 시 롤아웃 버킷팅의 결정론성/균일성 보장이 까다롭습니다.

## 솔루션
- 속성 조건(eq/in/gte/contains 등) 기반 규칙 평가 엔진.
- FNV-1a 해시로 `flagKey:userId`를 0..99 버킷에 결정론적으로 매핑해 안정적 롤아웃.
- 마스터 스위치 + 규칙 우선순위 + 디폴트 폴백, `explain()`으로 평가 사유 추적.

## 타겟 사용자
- 점진 배포가 필요한 SaaS/스타트업 엔지니어링 팀.
- 비용/복잡도 때문에 상용 플래그 도입을 미룬 팀.
- 엣지/서버리스 환경에서 가벼운 평가가 필요한 개발자.

## 핵심 기능
1. 규칙 평가 엔진 — 다중 조건(AND), 8종 연산자, 변형(variant) 반환.
   - eq/neq/in/nin/gt/gte/lt/lte/contains 연산자로 속성 타겟팅.
2. 결정론적 롤아웃 — 해시 버킷팅으로 사용자별 일관된 on/off, 균일 분포.
   - FNV-1a 해시로 `flagKey:userId`를 0..99에 매핑, 재배포 없이 안정적 점진 노출.
3. SDK 클라이언트 — `isEnabled()` / `variant()` / `explain()`.
4. 평가 사유 추적 — `disabled / rule_match / rollout_excluded / default`.
5. 순수 코어 — 서버·엣지·브라우저 동일 동작, JSON 설정 주입.

## 사용 예시
```ts
import { FlagClient } from './lib/engine';
const client = new FlagClient([{
  key: 'new-checkout', enabled: true, defaultValue: false,
  rules: [
    { conditions: [{ attribute: 'plan', operator: 'eq', value: 'pro' }], serve: true },
    { conditions: [], rollout: 25, serve: true }, // 그 외 25% 점진 노출
  ],
}]);
client.isEnabled('new-checkout', { userId: 'u1', plan: 'free' });
```

## 도입 시나리오
- 신규 기능을 pro 사용자에게 먼저, 이후 전체 25%→100%로 점진 확대.
- 위험 기능을 마스터 스위치로 즉시 비활성화(킬 스위치).
- `explain()`으로 "왜 이 사용자에게 켜졌는지" 디버깅.

## 수익 모델
- 오픈코어: 평가 엔진 + SDK는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: 자체 호스팅, 무제한 플래그.
  - Pro ($19/월): 관리 대시보드, 실시간 동기화, 변경 감사 로그.
  - Team ($79/월): 환경 분리(dev/stg/prod), 승인 워크플로, 역할 권한.

## 경쟁사
- LaunchDarkly — 업계 표준이나 가격이 높고 소규모 팀에 과함.
- Flagsmith / Unleash — 오픈소스지만 자체 호스팅 운영 부담.
- ConfigCat / Split.io — SaaS 종속, 엣지 평가 제약.

## 차별점
- 의존성 0 평가 코어로 엣지/브라우저까지 동일 SDK.
- 해시 버킷팅의 결정론성과 균일성을 테스트로 보증.
- 설정을 정적 JSON으로 주입 가능 → 오프라인/SSR 평가 용이.
- 평가 사유(`explain`) 노출로 디버깅·감사 친화적.

## KPI
- SDK 설치 수, 일일 플래그 평가 호출 수.
- 활성 플래그 수, 롤아웃 진행 플래그 비율.
- Free→Pro 전환율, 대시보드 활성 사용자.
- 킬 스위치 사용 빈도(운영 가치 지표).

## 로드맵
- v0.1: 규칙 엔진 + 결정론적 롤아웃 + SDK(현재).
- v0.2: 다변량 변형, 세그먼트 재사용.
- v0.3: 실시간 동기화(SSE) + 관리 대시보드.
- v1.0: 환경 분리, 승인 워크플로, 감사 로그(Team).
