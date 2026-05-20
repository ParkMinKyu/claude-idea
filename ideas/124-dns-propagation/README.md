# 124 · DNS 전파 체커

## 개요
여러 공개 DNS resolver(Google, Cloudflare, Quad9 등)에 동일 레코드를 조회해 응답을 비교하고, DNS 변경이 전 세계에 전파됐는지 한눈에 보여주는 도구. 도메인 이전·DNS 변경 시 필수 체크 도구를 지향한다.

## 문제
- DNS 레코드를 변경한 뒤 TTL과 캐싱 때문에 resolver마다 다른 값을 반환해 혼란스럽다.
- "전파됐나?"를 확인하려고 여러 곳을 수동으로 dig 해야 한다.
- resolver 간 불일치(부분 전파)를 정량적으로 파악하기 어렵다.

## 솔루션
- 다수 resolver에 같은 (도메인, 타입) 조회를 병렬 실행
- 응답 레코드를 정규화·정렬해 resolver 간 일치/불일치 비교
- 전파율(%)과 기대값 대비 일치 여부를 계산
- A/AAAA/CNAME/MX/TXT/NS 레코드 타입 지원

## 타겟 사용자
- 도메인을 이전하거나 DNS를 자주 바꾸는 운영자
- 호스팅/도메인 관련 서포트 엔지니어
- 마이그레이션을 진행하는 SRE

## 핵심 기능
1. **멀티 resolver 조회** — 여러 resolver에 병렬 질의
2. **응답 정규화** — 레코드 정렬·중복 제거로 비교 가능한 형태로 변환
3. **전파율 계산** — 기대값과 일치하는 resolver 비율 산출
4. **불일치 탐지** — resolver별 다른 응답을 그룹핑해 표시
5. **CLI/API** — 텍스트·JSON 출력, exit code로 자동화 연동

## 수익 모델
| 플랜 | 가격 | resolver 수 | 조회/일 | 비고 |
|---|---|---|---|---|
| Free | $0 | 5 | 100 | 웹 UI |
| Pro | $12/월 | 30+ (전세계) | 10k | API 키 |
| Team | $49/월 | 50+ | 100k | 모니터링 + 알림 |
| Enterprise | 문의 | 커스텀 노드 | 무제한 | SLA |

## 경쟁사
- whatsmydns.net, dnschecker.org, DNS Propagation Checker(여러 무료 사이트)

## 차별점
- 비교/전파율 로직을 순수 함수로 분리해 API·CI 게이트로 직접 활용 가능
- "기대값 도달까지 모니터링" 모드로 변경 완료를 자동 감지
- resolver 응답 시간까지 함께 측정해 느린 resolver 진단
- 한국 ISP(KT/SKB/LGU+) resolver를 기본 포함

## 사용 예시
```bash
# 여러 resolver에 A 레코드 조회 후 전파율 비교
npx dns-prop example.com A --json
```
출력 예: `example.com A — 전파율 75% (불일치)` + resolver별 응답 목록

## KPI
- 일일 조회 수
- API 사용 고객 수
- "전파 완료" 자동 감지 정확도
- Pro 전환율
- 평균 resolver 응답 지연

## 로드맵
- **MVP (현재)**: 멀티 resolver 병렬 조회, 응답 정규화, 전파율/불일치 계산, CLI
- **v1**: 글로벌 엣지 분산 조회, 모니터링 모드(기대값 도달 시 알림)
- **v2**: DNSSEC 검증, resolver 지리 위치 지도 시각화
- **v3**: API 상품화, 변경 이력 추적, 도메인 이전 마법사

## 리스크 & 가정
- whatsmydns 등 무료 사이트가 강력하므로 "API/CI 게이트 + 모니터링"이 차별
- resolver 캐싱/타임아웃 편차로 일시적 false mismatch가 생길 수 있음
