# TECH STACK · Favicon Generator

## 언어/런타임
- Python 3.11
- 코어 계획 로직(`src/favicon.py`)은 stdlib만 사용 → 테스트에 외부 패키지 불필요
- 이미지 리사이즈 엣지 레이어(`src/render.py`)만 Pillow 의존

## 코어 라이브러리 (`src/favicon.py`)
- `plan_sizes`: 소스 해상도 기준 업스케일 금지 사이즈 선정
- `output_filename`: 플랫폼별 파일명 규칙 (apple/ms/일반)
- `build_manifest` / `manifest_json`: PWA 매니페스트 생성
- `build_html_tags`: apple/android/MS/manifest `<head>` 태그
- `nearest_source`: 목표 크기에 가장 적합한 비업스케일 소스 선택

## 렌더 레이어 (`src/render.py`)
- Pillow로 중앙 정사각 크롭 + LANCZOS 리샘플
- 계획된 사이즈만큼 PNG 출력 + `site.webmanifest` 작성

## API/서비스 설계
- FastAPI 업로드 엔드포인트 → 백그라운드 작업으로 렌더
- 결과 ZIP은 S3/R2 저장, 서명 URL로 다운로드
- 종량제 API는 API key + 사용량 미터링(Postgres)

## 테스트
- `pytest` (stdlib 코어만 검증, Pillow 불필요)
- 검증 포인트: 업스케일 금지, 매니페스트 구조, 태그 완전성

## 배포/운영
- 컨테이너(Docker) + Cloud Run/Fly.io
- 렌더 워커는 별도 큐(예: Celery/RQ)로 수평 확장
