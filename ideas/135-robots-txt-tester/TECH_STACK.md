# TECH STACK · robots.txt Tester

## 언어/런타임
- Python 3.11, stdlib만 사용(`re`, `urllib.parse`)
- 외부 의존성 없음 → 테스트에 pytest만 필요

## 코어 라이브러리 (`src/robots.py`)
- `parse`: User-agent 그룹화, Allow/Disallow/Sitemap/Crawl-delay 처리
- `_pattern_to_regex` / `path_match`: `*`, `$` 패턴을 정규식으로 변환·매칭
- `_select_group`: 특정 UA 토큰 우선, 없으면 `*` 그룹
- `can_fetch`: 최장 일치 + 동률 시 Allow 우선으로 허용 여부 결정

## CLI (`src/cli.py`)
- `python -m src.cli <robots.txt> <ua> <url>` → ALLOWED/BLOCKED, exit 0/1
- CI 게이트로 활용 가능

## 테스트
- `pytest` (stdlib 코어만 검증)
- 검증 포인트: 그룹 파싱, 최장 일치 Allow 우선, 와일드카드/앵커, 특정 UA 우선

## 서비스화
- FastAPI 엔드포인트로 단건/일괄 검사 제공
- robots.txt 주기 모니터링(스케줄러) + 변경 diff 알림(웹훅/Slack)
- 다중 도메인은 Postgres에 스냅샷 저장 후 비교

## 정확성 노트
- RFC 9309의 그룹/최장 일치/Allow 우선 규칙을 따름
- crawl-delay는 비표준이지만 실무 호환을 위해 파싱
