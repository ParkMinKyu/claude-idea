# 126 · 성능 측정 CI

## 개요
Lighthouse 등에서 나온 성능 지표(LCP, CLS, TBT, 점수 등)를 CI에서 임계값·기준선(baseline)과 비교해 성능 회귀를 자동으로 차단하는 도구. Lighthouse CI의 핵심인 "assertion/회귀 검사"를 가볍게 재구현한다.

## 문제
- 성능 점수는 측정만 하고 PR마다 비교·차단하지 않으면 서서히 나빠진다.
- 절대 임계값만으로는 부족하고, 직전 main 대비 회귀(예: LCP +20%)를 잡아야 한다.
- 지표마다 "낮을수록 좋음/높을수록 좋음"이 달라 비교 로직이 헷갈린다.

## 솔루션
- 측정 결과 JSON에서 핵심 지표를 추출
- 절대 임계(budget)와 기준선 대비 회귀(% 허용) 두 가지 규칙으로 평가
- 지표 방향(낮을수록/높을수록 좋음)을 인지해 위반 판정
- CI exit code + 마크다운 리포트로 PR 게이트 구성

## 타겟 사용자
- 웹 성능을 관리하는 프론트엔드 팀
- 성능 예산을 도입하려는 플랫폼 엔지니어
- 회귀 방지를 원하는 오픈소스 메인테이너

## 핵심 기능
1. **지표 추출** — Lighthouse/Web Vitals JSON에서 LCP/CLS/TBT/perf score 정규화
2. **버짓 어서션** — 지표별 절대 임계값 위반 검사
3. **회귀 검사** — baseline 대비 허용 변화율(%) 초과 검사
4. **방향 인지** — lower-is-better/higher-is-better 자동 처리
5. **리포트/게이트** — 위반 목록 + exit code, 마크다운 출력

## 수익 모델
| 플랜 | 가격 | 프로젝트 | 기능 |
|---|---|---|---|
| OSS | $0 | 무제한 | CLI 어서션 |
| Cloud | $19/월 | 5 | baseline 저장 + 추이 그래프 |
| Team | $79/월 | 50 | PR 코멘트 봇 + 알림 |
| Enterprise | 문의 | 무제한 | 온프렘, SSO |

## 경쟁사
- Lighthouse CI(OSS), SpeedCurve, Calibre, DebugBear

## 차별점
- 어서션/회귀 로직을 측정 도구와 분리 → Lighthouse, WebPageTest, 커스텀 지표 모두 적용
- baseline 비교를 순수 함수로 제공해 어떤 CI에도 임베드 용이
- 절대 버짓 + 상대 회귀를 동시에 평가
- 한국어 리포트 및 모바일 3G 프리셋

## 사용 예시
```bash
# lighthouse 결과를 버짓 + baseline 회귀로 검사
npx perf-assert lhr.json --config budget.json --baseline main-lhr.json
```
출력 예: `### 성능 검사: 실패 ❌` + 위반 목록(LCP 회귀 등)

## KPI
- CI에 통합한 프로젝트 수
- 차단된 회귀 PR 수
- 평균 성능 점수 추이(개선)
- Cloud 전환율
- false positive 회귀 비율

## 로드맵
- **MVP (현재)**: 지표 추출, 버짓 어서션, baseline 회귀 검사, 마크다운 리포트, 게이트
- **v1**: baseline 클라우드 저장, GitHub PR 코멘트, 다중 URL 평균
- **v2**: 통계적 유의성(여러 회 측정 분산), 추이 그래프 대시보드
- **v3**: WebPageTest/커스텀 지표 어댑터, 알림, 온프렘

## 리스크 & 가정
- 측정 변동성으로 false positive 회귀가 생길 수 있어 분산 처리가 중요
- Lighthouse CI(OSS)가 존재하므로 "어서션 분리 + 회귀 UX"가 차별
