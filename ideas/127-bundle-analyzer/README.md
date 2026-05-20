# 127 · 번들 사이즈 추적기

## 개요
webpack/Vite/esbuild의 `stats.json`을 파싱해 번들·청크 사이즈를 집계하고, 기준선(baseline) 대비 사이즈 회귀를 PR에서 차단하는 도구. bundlesize/size-limit의 stats 기반 대체재를 지향한다.

## 문제
- 무심코 추가한 의존성 하나가 번들을 수백 KB 늘려도 머지될 때까지 모른다.
- gzip 사이즈, 청크별 증감을 PR에서 자동 비교하는 표준 워크플로가 부족하다.
- 절대 한도(budget)와 직전 대비 증가(diff)를 함께 보고 싶다.

## 솔루션
- `stats.json`에서 asset/chunk별 크기 추출 (raw + gzip 추정)
- baseline stats와 비교해 자산별 증감(delta) 계산
- 절대 사이즈 버짓 위반 + 회귀(절대/비율) 위반 평가
- 마크다운 diff 테이블 + CI exit code

## 타겟 사용자
- 번들 사이즈를 관리하는 프론트엔드 팀
- 라이브러리 메인테이너(배포 크기 민감)
- 성능 예산을 운영하는 플랫폼팀

## 핵심 기능
1. **stats 파서** — assets/chunks/모듈 크기 정규화 (webpack/Vite 호환)
2. **gzip 추정** — raw 대비 압축 추정 또는 stats의 gzip 값 사용
3. **사이즈 diff** — baseline 대비 자산별 증감 계산
4. **버짓 + 회귀 게이트** — 절대 한도와 증가 임계 동시 평가
5. **리포트** — 증감 테이블 + exit code

## 수익 모델
| 플랜 | 가격 | 프로젝트 | 기능 |
|---|---|---|---|
| OSS | $0 | 무제한 | CLI diff/게이트 |
| Cloud | $15/월 | 5 | baseline 저장 + 추이 |
| Team | $59/월 | 50 | PR 코멘트 봇 + 알림 |
| Enterprise | 문의 | 무제한 | 온프렘, SSO |

## 경쟁사
- bundlesize, size-limit, RelativeCI, bundlewatch, Codecov Bundle Analysis

## 차별점
- 파서/diff/게이트를 순수 함수로 분리해 어떤 번들러 stats에도 적용
- 절대 버짓 + 상대 회귀를 한 번에 평가
- 청크 단위와 자산 단위 모두 추적
- 한국어 리포트와 모바일 데이터 비용 환산(선택)

## 사용 예시
```bash
# stats.json을 baseline과 비교, 버짓/회귀 게이트
npx bundle-diff stats.json --baseline main-stats.json --config budget.json
```
출력 예: `### 번들 사이즈 검사: 실패 ❌` + 자산별 증감 테이블

## KPI
- 추적 중인 프로젝트 수
- 차단된 사이즈 회귀 PR 수
- 평균 번들 사이즈 추이(감소)
- Cloud 전환율
- 평균 검출 증가량(KB)

## 로드맵
- **MVP (현재)**: stats 파서(webpack/Vite), gzip 추정, 사이즈 diff, 버짓+회귀 게이트
- **v1**: baseline 클라우드 저장, GitHub PR 코멘트, gzip 실측(zlib)
- **v2**: 모듈 트리맵 시각화, 중복 의존성 탐지
- **v3**: 청크 그래프 UI, 알림, 온프렘

## 리스크 & 가정
- size-limit/bundlesize 등 무료 도구가 많아 "stats 범용 파싱 + 회귀 UX"가 차별
- 번들러마다 stats 포맷이 달라 파서 호환성이 채택의 관건
