# 065 - Error Tracker Lite (Sentry 라이트 버전)

## 개요
Sentry 비용이 부담되는 인디 해커 / 스타트업을 위한 가벼운 에러 추적 SaaS입니다. 핵심 기능(스택 트레이스 그룹화, 알림, source map)만 제공하며 가격은 Sentry의 1/5 수준입니다. Sentry SDK 호환 wire protocol을 채택해 마이그레이션이 즉시 가능합니다.

## 문제
- Sentry는 강력하나 가격이 빠르게 증가 ($26/월 → 수백 달러)
- 작은 팀은 모든 기능을 쓰지 않음 (퍼포먼스 추적, 세션 리플레이 등)
- 셀프호스팅 Sentry는 무거움 (Redis + Kafka + Postgres + Snuba)
- 한국 결제 (토스/카카오) 미지원

## 솔루션
- Sentry SDK 호환 envelope endpoint (`POST /api/{project}/store/`, `/envelope/`)
- 자동 그룹화: 스택 트레이스 fingerprint
- 이메일 / Slack / Discord 알림
- Source map 업로드 (자바스크립트 minify 디코드)
- 30일 / 90일 보관 플랜
- 셀프호스팅: 단일 Docker Compose (Sentry는 30+ 컨테이너)

## 타겟
- 인디 해커, 1인 SaaS
- 시드 단계 스타트업 (~10명)
- 한국 기업 (현지 결제 / 한국어)
- 셀프호스팅 선호 보안 민감 조직

## 핵심 기능
1. **SDK 호환**: Sentry JS / Python / Go / Ruby SDK 그대로 사용
2. **자동 그룹화**: 스택 fingerprint 기반
3. **이슈 대시보드**: 발생 빈도, 영향 사용자, 첫 발생 시각
4. **알림**: 이메일, Slack, Discord, 웹훅
5. **Source map**: JS 디코드
6. **릴리스 추적**: 릴리스별 회귀 감지
7. **사용자 컨텍스트**: 영향 사용자 수
8. **셀프호스팅** (오픈코어): 단일 Compose

## 수익 모델
- **오픈코어**: 셀프호스팅 코어 Apache 2.0
- **Cloud Free**: 5K 이벤트/월, 1 프로젝트
- **Cloud Solo ($9/월)**: 100K 이벤트, 무제한 프로젝트, 30일 보관
- **Cloud Team ($29/월, 5인)**: 1M 이벤트, 90일 보관, SSO
- **Enterprise**: 셀프호스팅 지원, 무제한

## 경쟁사
- Sentry (강력하나 비쌈)
- Rollbar, Bugsnag (가격 유사)
- GlitchTip (오픈소스 Sentry 호환, 가장 직접적 경쟁자)
- Highlight.io (세션 리플레이 위주)

## 차별점
- 가격 (Sentry 1/5)
- 한국 결제, 한국어 UI
- 단순한 셀프호스팅 (단일 Docker)
- Sentry SDK 호환 (제로 마이그레이션 비용)
- 핵심 기능에 집중 (퍼포먼스 / 리플레이 추가 없음 → 가볍고 저렴)

## KPI
- 일간 수집 이벤트 수
- 활성 프로젝트 수
- Free → Solo 전환율 (목표 6%, 가격 진입장벽 낮음)
- Sentry → 우리 마이그레이션 수 (성공 지표)
- 셀프호스팅 Docker pull 수
- 평균 그룹화 정확도 (false group 비율)
