# 기술 스택 · 113 경량 피처 플래그

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ / 엣지 런타임 / 브라우저 호환(웹 표준 API만 사용)

## 코어 설계
- 의존성 0의 순수 함수 모듈(`src/lib/engine.ts`).
  - `compare()` — 8종 연산자(eq/neq/in/nin/gt/gte/lt/lte/contains).
  - `ruleMatches()` — 조건 AND 평가.
  - `bucket()` — FNV-1a 해시 기반 결정론적 0..99 버킷.
  - `evaluate()` — 마스터 스위치 → 규칙 → 롤아웃 → 디폴트 폴백, 사유 반환.
  - `FlagClient` — `isEnabled/variant/explain` SDK 표면.

## 설정 모델
- `FlagDefinition`(key/enabled/defaultValue/rules) JSON으로 주입.
- 정적 주입 가능 → SSR/엣지/오프라인 평가에 적합.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/engine.test.ts` — 규칙 평가, 연산자, 롤아웃 경계(0%/100%), 해시 균일성(2000 샘플).
- 순수 함수라 네트워크 없이 결정론적으로 검증.

## 빌드 / 배포
- npm SDK 패키지(ESM/CJS 듀얼). 코어는 트리셰이커블.
- Pro 대시보드는 별도 서비스가 동일 평가 코어를 임포트.

## 향후 확장
- 실시간 동기화(SSE/WebSocket)로 무재배포 토글.
- 변형 다중화(다변량 실험), 세그먼트 재사용.
- 변경 감사 로그 및 승인 워크플로(Team 티어).
