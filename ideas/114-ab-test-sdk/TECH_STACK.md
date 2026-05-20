# 기술 스택 · 114 A/B 테스트 SDK

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ / 엣지 / 브라우저 호환

## 코어 설계
- 의존성 0의 순수 함수 모듈 2개.
  - `src/lib/assign.ts` — `hashToUnit()`(FNV-1a→[0,1)), `assign()`(가중치/할당), `ExperimentClient`.
  - `src/lib/stats.ts` — `analyze()`(two-proportion z-test), `twoTailedP()`(정규 CDF 근사),
    `sampleSizePerArm()`(표본 크기).
- 등록(enroll)과 변형(variant) 해시 공간을 분리해 한쪽 변경 시 다른쪽 안정성 유지.

## 통계
- 표준정규 CDF는 Abramowitz & Stegun 7.1.26 근사식 사용(외부 라이브러리 불필요).
- 풀드(pooled) 표준오차로 z 계산, 양측 p-value 산출.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/assign.test.ts` — 결정론성, 50/50·90/10 분포, 트래픽 할당(5000 샘플).
- `tests/stats.test.ts` — z=1.96→p≈0.05, 유의/비유의 판정, 표본 크기 단조성.
- 순수 함수라 오프라인 결정론적 검증.

## 빌드 / 배포
- npm SDK 패키지(ESM/CJS), 트리셰이커블.
- Pro 대시보드는 동일 통계 코어를 서버에서 재사용.

## 향후 확장
- 순차 검정/베이지안 분석 옵션.
- 세그먼트별 분해, 다변량(MAB) 실험.
- 자동 표본 크기 도달 알림.
