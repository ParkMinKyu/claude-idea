# TECH STACK · 127 번들 사이즈 추적기

## 언어 / 런타임
- **Node.js 20+** (ESM) — 번들러 생태계와 동일 런타임
- 코어 로직 외부 의존성 0 (실제 gzip 측정 시 내장 `zlib` 사용 가능)

## 코어 아키텍처
- `src/parser.js` — `stats.json`에서 assets/chunks 정규화 (webpack/Vite 형태 모두 처리)
- `src/diff.js` — baseline 대비 자산별 증감 계산 순수 함수
- `src/assert.js` — 버짓(절대) + 회귀(증가 임계) 평가
- `src/report.js` — 마크다운 diff 테이블
- `src/cli.js` — stats/baseline/config 입력, exit code

## stats 파싱
- webpack: `stats.assets[]` = `{ name, size }`
- Vite/rollup-plugin-visualizer 등 다른 형태도 `assets`/`output` 키를 흡수
- 소스맵(.map) 자산은 기본 제외

## gzip 추정
- stats에 gzip 값이 있으면 사용
- 없으면 `raw * 0.32` 휴리스틱 또는 `zlib.gzipSync`(파일 접근 가능 시)

## 비교/게이트 모델
- diff: `delta = current - baseline` (신규/삭제 자산 포함)
- budget: `{ pattern, maxBytes }`
- regression: 자산 증가가 `maxIncreaseBytes` 또는 `maxIncreasePct` 초과 시 위반

## 테스트
- **vitest** — 픽스처 stats JSON으로 파싱·diff·게이트를 빌드 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- baseline 저장: Cloud(S3/Postgres)에 main 결과 보관
- PR 코멘트: GitHub App
- 추이 대시보드: Next.js + Vercel

## 확장 계획
- 모듈 단위 트리맵 시각화
- 중복 의존성 탐지
- Treemap UI 및 청크 그래프
