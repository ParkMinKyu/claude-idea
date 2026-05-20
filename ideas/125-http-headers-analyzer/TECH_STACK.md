# TECH STACK · 125 보안 헤더 분석기

## 언어 / 런타임
- **Node.js 20+** (ESM) — 내장 `fetch`로 헤더 수집
- 코어 분석 로직은 외부 의존성 0

## 코어 아키텍처
- `src/headers.js` — 헤더 정규화(소문자 키), 멀티값 파싱 순수 함수
- `src/rules.js` — 보안 헤더별 검사 규칙 = `(headers) => Finding`. 점수·권고 포함
- `src/analyze.js` — 규칙 실행 + 점수/등급 합산
- `src/fetch.js` — URL의 응답 헤더를 가져오는 I/O 레이어 (주입형)
- `src/cli.js` — URL 입력, 텍스트/JSON 출력, exit code

## 점수 모델
- 각 보안 헤더에 가중치 부여 → 충족 시 가산, 미흡 시 부분/0점
- 총점 100 만점을 A(90+)/B(80+)/C(70+)/D(60+)/F(그 외)로 매핑
- 정보 노출 헤더는 감점

## 검사 헤더 (MVP)
- Strict-Transport-Security (max-age ≥ 1년 권장)
- Content-Security-Policy (존재 + unsafe-inline 경고)
- X-Frame-Options / frame-ancestors
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

## 테스트
- **vitest** — 가짜 헤더 객체로 파싱·규칙·점수·등급을 네트워크 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- 스캐너: 서버리스 함수 (헤더만 가져오므로 경량)
- 저장: Postgres (스캔 이력, 점수 추이)
- 웹 UI: Next.js + Vercel

## 확장 계획
- CSP 디렉티브 정밀 분석 (소스 화이트리스트 점검)
- 쿠키 보안 속성(Secure/HttpOnly/SameSite) 검사
- 회귀 추적 및 알림
