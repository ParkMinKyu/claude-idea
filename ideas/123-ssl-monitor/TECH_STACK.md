# TECH STACK · 123 SSL 인증서 만료 모니터

## 언어 / 런타임
- **Node.js 20+** (ESM) — 내장 `tls` 모듈로 인증서를 직접 가져올 수 있음
- 코어 로직은 외부 의존성 0

## 코어 아키텍처
- `src/cert.js` — 인증서 객체(파싱된 표준 필드)에서 만료/호스트명/서명 정보를 추출하는 순수 함수
- `src/fetch.js` — 내장 `tls.connect`로 실제 도메인의 인증서를 가져오는 I/O 레이어 (테스트에서는 주입형)
- `src/monitor.js` — 여러 도메인 결과를 모아 상태 요약 및 알림 대상 산출
- `src/cli.js` — 도메인 목록 입력, 텍스트/JSON 출력, exit code

## 인증서 처리
- `tls.TLSSocket.getPeerCertificate()` 결과를 입력으로 사용 (`valid_from`, `valid_to`, `subject`, `subjectaltname`, ...)
- 잔여일 = (notAfter - now) / 86400000, 음수면 만료

## 임계 모델
- 기본 임계: warning ≤ 30일, critical ≤ 7일, expired < 0일
- 임계값은 설정으로 오버라이드 가능

## 테스트
- **vitest** — 가짜 인증서 객체로 만료 분류·호스트명 매칭·약한 서명 탐지를 네트워크 없이 검증

## 알림 (프로덕션 계획)
- 이메일(Resend), Slack incoming webhook, 사용자 webhook
- 만료 캘린더 .ics 생성

## 배포 / 인프라
- 워커: cron으로 도메인 fan-out (Cloudflare Workers / Node cron)
- 저장소: Postgres (도메인, 마지막 체크 결과)
- 대시보드: Next.js + Vercel

## 확장 계획
- Certificate Transparency 로그 모니터링 (미발급/오발급 탐지)
- mTLS 클라이언트 인증서 추적
- 인증서 체인 전체 신뢰성 검증
