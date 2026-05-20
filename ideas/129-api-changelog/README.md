# 129 · API 변경 추적/알림

## 개요
두 버전의 OpenAPI 스펙을 비교(diff)해 변경사항을 추출하고, breaking/non-breaking으로 분류한 뒤 사람이 읽을 수 있는 변경 로그와 알림을 생성하는 도구. oasdiff의 SaaS·알림 친화 대체재를 지향한다.

## 문제
- API를 바꾸면 클라이언트가 깨지지만, 무엇이 breaking인지 수동으로 판단하기 어렵다.
- 변경 로그를 손으로 쓰면 누락·부정확이 생긴다.
- 외부 API 의존 시 제공자의 변경을 사전에 감지할 방법이 마땅치 않다.

## 솔루션
- 두 OpenAPI 문서의 경로/오퍼레이션/파라미터/스키마를 비교
- 규칙으로 변경을 breaking/non-breaking/info로 분류
- 마크다운 변경 로그 자동 생성
- (확장) 외부 스펙을 폴링해 변경 시 알림

## 타겟 사용자
- 공개 API를 제공하는 백엔드/플랫폼 팀
- API를 소비하는 클라이언트 개발자
- API 거버넌스를 담당하는 아키텍트

## 핵심 기능
1. **OpenAPI diff** — 경로 추가/삭제, 오퍼레이션/파라미터/응답 변경 추출
2. **Breaking 분류** — 엔드포인트 삭제, 필수 파라미터 추가, 응답 제거 등 규칙 기반 판정
3. **변경 로그 생성** — 분류별 마크다운 출력
4. **CI 게이트** — breaking 변경 시 exit code 1
5. **(확장) 폴링 알림** — 외부 스펙 URL 변경 감지

## 수익 모델
| 플랜 | 가격 | API 수 | 기능 |
|---|---|---|---|
| OSS | $0 | 무제한 | CLI diff/게이트 |
| Cloud | $19/월 | 5 | 변경 이력 + 알림 |
| Team | $79/월 | 50 | PR 코멘트 + 외부 API 모니터 |
| Enterprise | 문의 | 무제한 | 온프렘, SSO |

## 경쟁사
- oasdiff(OSS), Optic, Bump.sh, Apideck, Postman API 변경 감지

## 차별점
- diff/분류 로직을 순수 함수로 분리해 CI·라이브러리·SaaS 모두 재사용
- breaking 규칙을 설정으로 확장 가능 (사내 호환성 정책 반영)
- 변경 로그 자동 생성 + 외부 API 모니터링을 한 제품에 통합
- 한국어 변경 로그 및 의미 기반 버전 제안(semver bump)

## 사용 예시
```bash
# 두 OpenAPI 스펙 비교 (breaking 변경 시 exit 1)
npx api-diff openapi-v1.yaml openapi-v2.yaml
```
출력 예: `제안 버전 변경: major` + Breaking/호환/참고 섹션별 변경 로그

## KPI
- 분석된 스펙 diff 수
- 차단된 breaking PR 수
- 모니터링 중인 외부 API 수
- Cloud 전환율
- breaking 분류 정확도

## 로드맵
- **MVP (현재)**: 경로/오퍼레이션/파라미터/응답 diff, breaking 분류, 변경 로그, semver 제안
- **v1**: 스키마(필드/타입) 깊은 비교, GitHub PR 코멘트, 커스텀 규칙
- **v2**: 외부 API 스펙 폴링 모니터링 + 알림, 변경 이력 저장
- **v3**: 다채널 알림, 거버넌스 대시보드, 온프렘

## 리스크 & 가정
- oasdiff(OSS)가 강력하므로 "SaaS 알림 + 외부 API 모니터링 + 한국어"가 차별
- breaking 규칙의 정확도가 신뢰의 핵심(과대 경고 시 무시됨)
