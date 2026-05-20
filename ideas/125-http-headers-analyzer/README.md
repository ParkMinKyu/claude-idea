# 125 · 보안 헤더 분석기

## 개요
웹사이트의 HTTP 응답 헤더를 분석해 보안 헤더(HSTS, CSP, X-Frame-Options 등) 적용 여부를 점검하고 보안 점수(A~F)와 개선 가이드를 제공하는 도구. securityheaders.com의 API 우선 대체재를 지향한다.

## 문제
- HSTS, CSP, X-Content-Type-Options 같은 보안 헤더 누락은 흔하지만 눈에 잘 안 띈다.
- 헤더 설정의 적절성(예: 약한 CSP, 짧은 HSTS max-age)을 판단하려면 전문 지식이 필요하다.
- 정보 노출 헤더(Server, X-Powered-By)를 점검할 일관된 기준이 없다.

## 솔루션
- 응답 헤더를 파싱해 보안 헤더 존재/값 검사
- 헤더별 가중 점수로 종합 점수(0-100) 및 등급(A~F) 산출
- 누락·약한 설정에 대한 구체적 개선 권고 생성
- 정보 노출 헤더 경고

## 타겟 사용자
- 웹 개발자 및 프론트엔드/백엔드 엔지니어
- 보안 점검을 자동화하려는 DevSecOps
- 사이트를 진단하는 컨설턴트

## 핵심 기능
1. **헤더 파서** — 대소문자 무시 정규화, 멀티값 처리
2. **보안 규칙** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
3. **점수/등급** — 가중 합산 점수와 A~F 등급
4. **정보 노출 탐지** — Server/X-Powered-By 등 버전 노출 경고
5. **개선 권고** — 헤더별 권장 값과 설명 출력

## 수익 모델
| 플랜 | 가격 | 스캔/월 | 기능 |
|---|---|---|---|
| Free | $0 | 50 | 웹 UI 단건 스캔 |
| Pro | $15/월 | 5k | API + 배치 스캔 |
| Team | $59/월 | 50k | 정기 스캔 + 회귀 알림 |
| Enterprise | 문의 | 무제한 | 온프렘, 커스텀 규칙 |

## 경쟁사
- securityheaders.com, Mozilla Observatory, Hardenize, ImmuniWeb

## 차별점
- 점수 규칙을 순수 함수로 분리해 CI 게이트·라이브러리로 임베드 가능
- 헤더 변경을 추적해 회귀(점수 하락) 알림 제공
- 한국어 권고문 및 KISA 보안 가이드 매핑
- 단건 UI가 아닌 API 우선 설계로 자동화 친화

## 사용 예시
```bash
# 사이트의 보안 헤더 분석 (등급 C 이하면 exit 1)
npx headers-analyze https://example.com --json
```
출력 예: `https://example.com — 65/100 등급 C` + 헤더별 충족/권고 목록

## KPI
- 월간 스캔 수
- API 활성 키 수
- 평균 점수 개선폭 (재스캔 시)
- Pro 전환율
- 회귀 알림으로 복구된 헤더 수

## 로드맵
- **MVP (현재)**: 헤더 정규화, 보안 규칙 6종, 점수/등급, 정보 노출 탐지, CLI
- **v1**: 쿠키 보안 속성 검사, CSP 디렉티브 정밀 분석, 배치 스캔 API
- **v2**: 정기 스캔 + 회귀(점수 하락) 알림, KISA 가이드 매핑
- **v3**: 커스텀 규칙, 온프렘, 팀 대시보드

## 리스크 & 가정
- securityheaders.com이 무료로 강력하므로 "API 우선 + 회귀 추적 + 한국어"가 차별
- 헤더만으로는 실제 보안을 보장 못하므로 권고문 품질이 신뢰의 핵심
