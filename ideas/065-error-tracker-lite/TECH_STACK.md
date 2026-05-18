# 기술 스택 - 065 Error Tracker Lite

## 백엔드 (수집 + 처리)
- **Python 3.12** + **FastAPI** - 비동기 수집 엔드포인트
- **Uvicorn** + **gunicorn** (worker)
- **Pydantic** - 페이로드 검증
- **httpx** - source map 다운로드

## SDK 호환 엔드포인트
- `POST /api/{project_id}/store/` - 단일 이벤트
- `POST /api/{project_id}/envelope/` - 다중 이벤트
- Sentry envelope 포맷 파서 (자체 구현)
- DSN: `https://{public_key}@host/{project_id}`

## 큐 / 비동기
- **Redis** + **arq** (Python 비동기 워커)
- 무거운 처리(source map, fingerprint)는 큐로

## 데이터베이스
- **PostgreSQL 16** - 조직, 프로젝트, 이슈, 이벤트
- **TimescaleDB** (확장) - 이벤트 시계열, 빠른 카운팅
- **Redis** - 레이트 리미트, 캐시

## 그룹화
- 스택 트레이스 fingerprint:
  - 함수명 + 모듈 정규화
  - 라인 번호 무시 (회귀 추적은 릴리스로)
  - 자체 알고리즘 (Sentry의 grouping config 참고)

## Source Map
- 업로드: `POST /api/{project}/files/dsyms/`
- 디코드: `source-map` (Python 포팅) 또는 자체 `vlq` 파서

## 프론트엔드 (대시보드)
- **Next.js 14** - 별도 서비스
- **React** + **TypeScript** + **Tailwind**
- **Recharts** - 시계열 차트

## 인증
- **NextAuth.js** (GitHub / Google)
- 한국: 토스 로그인 (옵션)

## 알림
- **Resend** - 이메일
- **Slack / Discord webhook** - 즉시 알림
- 자체 webhook URL (Pro)

## 결제
- **Stripe** + **토스페이먼츠** (한국)

## 셀프호스팅 패키징
- 단일 **Docker Compose**: api + worker + postgres + redis
- 메모리 < 1GB (Sentry는 8GB+)

## 테스트
- **pytest** - 단위 + 통합
- **pytest-asyncio**
- **httpx AsyncClient** - 엔드포인트 테스트

## 모니터링
- 자체 도구 사용 (eat your own dog food)
- **Prometheus** + **Grafana** (셀프호스팅)

## CI/CD
- **GitHub Actions** - 멀티아치 이미지 빌드 (amd64/arm64)
- GHCR push
