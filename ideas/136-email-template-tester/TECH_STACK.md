# TECH STACK · Email Template Tester

## 언어/런타임
- Node.js 22 (ESM), 의존성 0
- 정규식 기반 정적 분석으로 가볍고 빠름(서버리스 적합)

## 코어 라이브러리 (`src/lint.js`)
- `RULES`: 클라이언트별 비호환 패턴을 선언적으로 인코딩
- `byteSize`: UTF-8 바이트 크기 계산(Gmail 클리핑 판정)
- `lint`: 모든 규칙 평가 → findings(rule/severity/message/clients)
- `report`: error/warning/info 집계 + pass/fail + 크기

## CLI (`src/cli.js`)
- `node src/cli.js <email.html>` → JSON 리포트, error 있으면 exit 1
- CI 파이프라인 게이트로 사용

## 테스트
- `node --test` (의존성 없이 `npm test`)
- 검증 포인트: flex/grid·script·video error, alt/스타일 위치, Gmail 클리핑

## 확장 로드맵
- 실제 렌더 스크린샷(헤드리스 렌더러 또는 Litmus/EoA API 연동)
- 규칙 커스터마이즈 + 팀별 정책 프로파일
- 인라인 CSS 자동 변환(juice 류) 옵션

## 정확성 노트
- 정적 분석은 1차 필터이며, 픽셀 단위 검증은 스크린샷 단계에서 보완
- 규칙은 공개된 클라이언트 지원 매트릭스(예: Can I email)를 근거로 유지보수
