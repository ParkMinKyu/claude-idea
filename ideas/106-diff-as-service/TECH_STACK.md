# Tech Stack · 106 Diff as a Service

## 런타임
- **Node.js 20** — 표준 `http` 모듈로 의존성 없는 경량 API 서버 구성

## diff 코어
- **자체 Myers O(ND) 구현** — 라이브러리(diff/jsdiff) 대신 직접 구현해 알고리즘 투명성과 임의 시퀀스(equals 주입) 유연성 확보
- 순수 함수 + equals 콜백 → 라인/단어/문자 단위를 동일 코어로 처리
- backtrack으로 최단 편집 스크립트를 ops 배열로 복원

## 출력 포맷
- ops 배열(프로그래밍 친화), unified diff 문자열(사람 친화), 통계
- ops로 new 텍스트를 정확히 재구성 가능 → 정합성 보장

## API 서버
- **node:http** — 단일 `POST /diff` 엔드포인트(데모/셀프호스팅용)
- 상용: **Hono on Cloudflare Workers**로 엣지 배포(저지연, 글로벌)

## 성능
- 큰 입력은 라인 분할 후 비교 → 메모리 통제
- 동일 라인 prefix/suffix 트리밍으로 D(편집 거리) 축소(상용 최적화)

## 데이터/과금
- **Upstash Redis** — 호출량 카운팅 + 레이트 리밋
- **Stripe Billing** — 사용량 기반 구독

## 테스트
- **Vitest** — 고전 케이스(ABCABBA→CBABAC), 동일/빈 입력, 재구성 정합성, 통계, unified 출력
- 핵심 불변식: `applyOps(diff(a,b)) === b`

## 선택 이유 요약
diff 정확성이 제품의 전부이므로 알고리즘을 직접 구현해 검증 가능하게 했고, 정합성(재구성) 불변식을 테스트로 고정했다. equals 주입 설계로 라인/단어/문자 단위를 하나의 코어로 확장한다.
