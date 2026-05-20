# 114 · A/B 테스트 SDK

## 개요
결정론적 버킷 할당과 통계 분석을 한 패키지로 제공하는 경량 A/B 테스트 SDK입니다.
사용자 식별자만 있으면 서버/클라이언트가 동일한 변형(variant)을 일관되게 산출하고, 실험
결과를 두 비율(two-proportion) z-검정으로 즉시 분석합니다. 코어는 의존성 0의 순수 함수입니다.

## 문제
- 상용 실험 플랫폼은 비싸고, 데이터가 외부로 나가 프라이버시 우려가 있습니다.
- 자체 구현 시 변형 할당의 결정론성·균일성, 그리고 통계적 유의성 계산이 어렵습니다.
- 표본 크기 산정 없이 실험을 시작해 조기 종료/거짓 양성이 빈번합니다.

## 솔루션
- FNV-1a 해시로 `experiment:unitId`를 [0,1)에 매핑해 안정적·균일한 변형 할당.
- 가중치 기반 분할과 트래픽 할당(allocation)으로 부분 노출 지원.
- two-proportion z-검정 + p-value + 상대 향상도, 표본 크기 계산기 제공.

## 타겟 사용자
- 그로스/제품 엔지니어, 데이터 분석가.
- 비용·프라이버시로 상용 플랫폼을 피하는 팀.
- SSR/엣지에서 결정론적 할당이 필요한 개발자.

## 핵심 기능
1. 결정론적 할당 — 같은 unitId는 항상 같은 변형, 서버/클라 일치.
   - enroll/variant 해시 공간 분리로 한쪽 변경 시 다른쪽 안정성 유지.
2. 가중치/트래픽 할당 — 90/10 분할, 30% 점진 노출 등.
3. 통계 분석 — z-score, 양측 p-value, 상대 향상도, 유의성 판정.
   - 풀드 표준오차 기반 two-proportion z-test, 외부 통계 라이브러리 불필요.
4. 표본 크기 계산 — 기준 전환율·MDE·검정력 기반 arm당 필요 표본.
5. 순수 코어 SDK — `ExperimentClient.getVariant()` 단일 진입점.

## 사용 예시
```ts
import { ExperimentClient } from './lib/assign';
import { analyze, sampleSizePerArm } from './lib/stats';

const client = new ExperimentClient([
  { key: 'cta', variants: [{ key: 'control', weight: 1 }, { key: 'treatment', weight: 1 }] },
]);
client.getVariant('cta', userId);            // 'control' | 'treatment'
analyze({ conversions: 120, visitors: 1000 }, { conversions: 150, visitors: 1000 });
sampleSizePerArm(0.1, 0.02);                 // arm당 필요 표본 수
```

## 도입 시나리오
- 실험 시작 전 표본 크기 계산으로 조기 종료/거짓 양성 방지.
- 서버와 클라이언트에서 동일 unitId로 일관된 변형 노출.
- 유의성 도달 후 안전하게 승자 변형으로 롤아웃.

## 수익 모델
- 오픈코어: 할당 + 통계 코어는 MIT 오픈소스.
- SaaS Pro 가격 티어:
  - Free: SDK, 자체 집계.
  - Pro ($29/월): 결과 대시보드, 실시간 유의성 모니터, 실험 보관.
  - Team ($99/월): 다변량/순차 검정, 세그먼트 분석, 권한/감사.

## 경쟁사
- Optimizely / VWO — 강력하나 고가, 데이터 외부 전송.
- GrowthBook — 오픈소스이나 운영 부담.
- Statsig / PostHog Experiments — SaaS 종속, 엣지 할당 제약.

## 차별점
- 의존성 0 코어로 엣지/SSR까지 동일 할당 보장.
- 할당과 통계가 한 패키지 — 추가 인프라 없이 분석까지.
- 결정론성·균일성·통계 정확도를 테스트로 보증.
- 표본 크기 계산기 내장으로 실험 설계 품질 향상.

## KPI
- SDK 설치 수, 활성 실험 수.
- 유의성 도달 실험 비율, 표본 계산기 사용률.
- Free→Pro 전환율, 대시보드 활성 사용자.
- 실험당 평균 노출 사용자 수.

## 로드맵
- v0.1: 결정론적 할당 + z-test + 표본 계산(현재).
- v0.2: 순차 검정/베이지안 분석 옵션.
- v0.3: 세그먼트 분해, 결과 대시보드.
- v1.0: 다변량(MAB), 자동 표본 도달 알림(Team).
