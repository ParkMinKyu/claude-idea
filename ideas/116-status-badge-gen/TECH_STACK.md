# 기술 스택 · 116 README 배지 생성기

## 언어 / 런타임
- TypeScript 5.5 (ESM)
- Node.js 18+ (CLI), 브라우저/엣지 호환(문자열 생성만 사용)

## 코어 설계
- 의존성 0의 순수 함수 모듈(`src/lib/badge.ts`).
  - `resolveColor()` — 명명 색상/HEX 해석 + 폴백.
  - `textWidth()` — ASCII 문자 폭 추정으로 레이아웃 계산.
  - `renderBadge()` — flat 스타일 SVG 문자열 생성, `escapeXml`로 안전 처리.
  - `coverageBadge()` — 커버리지 임계값 자동 색상 헬퍼.
- 출력이 결정론적 문자열이라 스냅샷/정규식 테스트에 적합.

## CLI
- `src/index.ts` — `node src/index.ts <label> <message> [color]`로 SVG를 stdout 출력.
- `coverage <pct>` 특수 경로로 임계값 색상 자동 적용.

## 테스트
- Vitest 1.6 — TS 직접 실행.
- `tests/badge.test.ts` — 색상 해석, 폭 단조성, XML 이스케이프, 너비 증가, aria-label, 커버리지 색상.
- 순수 문자열 생성이라 오프라인 결정론적 검증.

## 빌드 / 배포
- npm 라이브러리 + bin(`mkbadge`).
- Pro 동적 엔드포인트는 동일 렌더러를 서버리스 함수에 래핑.

## 향후 확장
- 실제 폰트 메트릭(Verdana) 테이블로 폭 정밀화.
- for-the-badge/plastic 등 추가 스타일.
- 로고(아이콘) 임베드, 커스텀 테마 토큰.
