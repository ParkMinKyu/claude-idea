# TECH STACK · Secret Scanner

## 언어/런타임
- Python 3.11, stdlib만 사용(`re`, `math`)
- 외부 의존성 없음 → 테스트에 pytest만 필요, pre-commit 훅 배포 용이

## 코어 라이브러리 (`src/scanner.py`)
- `PATTERNS`: 벤더별 정규식(AWS/GitHub/Stripe/Slack/Google/JWT/개인 키/일반 할당)
- `shannon_entropy`: 문자열 엔트로피(비트/문자) 계산
- `_high_entropy_tokens`: base64/hex 토큰 추출 후 엔트로피 임계 필터
- `scan_line` / `scan_text`: 라인/문서 스캔, 위치(line/column) 포함 Finding 생성
- `redact`: 리포트용 안전 마스킹

## CLI (`src/cli.py`)
- `python -m src.cli <file...>` → 마스킹된 findings 출력, 발견 시 exit 1
- pre-commit/CI 게이트로 사용

## 테스트
- `pytest` (stdlib 코어만 검증)
- 검증 포인트: 엔트로피 경계값, 벤더 패턴, 플레이스홀더 필터, 라인 번호

## 정밀도 전략
- 플레이스홀더 사전(example/your_/xxxx 등)으로 오탐 억제
- 엔트로피 임계(기본 4.0 bit/char, 길이 20+)는 티어/언어별 튜닝
- 베이스라인 파일로 기존 허용 항목 무시(노이즈 감소)

## 확장 로드맵
- git 히스토리 스캔(`git log -p` 파이프), 커밋 단위 차단
- 검출 키 자동 무효화 워크플로(벤더 API 연동)
- 커스텀 규칙 YAML, 조직 대시보드(웹)
