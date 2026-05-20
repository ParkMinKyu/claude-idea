# 121 · 쿠버네티스 매니페스트 검증기

## 개요
쿠버네티스 YAML 매니페스트를 클러스터에 배포하기 전에 파싱하고, 스키마 및 베스트 프랙티스 규칙으로 검증해 위험한 설정을 사전에 잡아내는 CLI + SaaS. `kubeval`·`kube-score`의 합리적 가격대 대체재를 지향한다.

## 문제
- 잘못된 YAML 들여쓰기, 누락된 필수 필드, 오타난 `apiVersion` 때문에 CI 후반부나 배포 시점에서야 에러가 터진다.
- `latest` 태그, 리소스 limit 누락, `privileged: true` 같은 안티패턴은 스키마 검증만으로는 잡히지 않는다.
- 보안·신뢰성 규칙을 팀 전체에 일관되게 강제하기 어렵고, 사내 정책을 코드화한 도구가 마땅치 않다.

## 솔루션
- YAML 멀티 도큐먼트(`---` 구분)를 파싱해 리소스 단위로 분해
- `kind`/`apiVersion` 기반 스키마 필수 필드 체크
- 보안·신뢰성 규칙 엔진으로 안티패턴을 error/warning/info 심각도로 분류
- 점수(0-100)와 머신리더블 JSON 리포트를 출력해 CI 게이트로 활용

## 타겟 사용자
- 쿠버네티스를 운영하는 플랫폼/DevOps 엔지니어
- GitOps 파이프라인(ArgoCD, Flux)을 쓰는 팀
- 매니페스트를 직접 작성하는 백엔드 개발자

## 핵심 기능
1. **멀티 도큐먼트 파서** — 하나의 파일 안 여러 리소스를 개별 검증
2. **스키마 체크** — kind별 필수 필드(`metadata.name`, `spec` 등) 존재 확인
3. **규칙 엔진** — `latest` 태그, 리소스 limit 누락, privileged 컨테이너, hostNetwork 등 탐지
4. **심각도 분류 & 점수** — error/warning/info로 분류하고 가중 점수 산출
5. **CI 통합** — exit code + JSON 리포트로 GitHub Actions/GitLab CI 게이트 구성

## 수익 모델
| 플랜 | 가격 | 검증 규칙 | 사용량 | 비고 |
|---|---|---|---|---|
| OSS | $0 | 기본 규칙 | 무제한 로컬 | CLI 오픈소스 |
| Team | $19/월 | 커스텀 규칙 + SaaS 대시보드 | 5 리포지토리 | PR 코멘트 봇 |
| Business | $79/월 | 정책 as code, SSO | 50 리포지토리 | 감사 로그 |
| Enterprise | 문의 | 온프렘, 전용 지원 | 무제한 | SLA |

## 경쟁사
- kubeval(아카이브됨), kube-score, kubeconform, Datree(Checkov에 인수), Polaris

## 차별점
- 스키마 검증 + 베스트 프랙티스 규칙 + 보안 규칙을 하나의 점수로 통합
- 규칙을 순수 함수로 모듈화해 사내 정책을 플러그인으로 손쉽게 추가
- 클러스터 접근 없이 정적 파일만으로 동작해 CI 초반 단계에 배치 가능
- 한국어 리포트 및 한국 기업 보안 가이드(예: 금융권 컨테이너 가이드) 프리셋 제공 예정

## 사용 예시
```bash
# 단일 매니페스트 검증 (위반 시 exit code 1)
npx k8s-validate deployment.yaml

# CI에서 JSON 리포트로 게이트
npx k8s-validate manifests/*.yaml --json > report.json
```
출력 예: `점수: 70/100 (리소스 2개) [WARNING] Deployment/web :: image-latest-tag — ...`

## KPI
- CLI 주간 다운로드 수 (npm)
- CI에 통합한 리포지토리 수
- 평균 검출 이슈 수 / 리포지토리
- Team 플랜 전환율 (OSS → 유료)
- 규칙 false positive 신고율

## 로드맵
- **MVP (현재)**: YAML 멀티 도큐먼트 파싱, 스키마/보안/신뢰성 규칙, 점수, CLI 게이트
- **v1**: 커스텀 규칙 플러그인, GitHub Action 래퍼, PR 코멘트 봇
- **v2**: CRD 스키마 자동 수집, Helm/Kustomize 렌더 검증, SaaS 대시보드
- **v3**: 정책 as code, SSO, 감사 로그, 온프렘 배포

## 리스크 & 가정
- kubeconform 등 무료 OSS와의 차별화는 "규칙 통합 + 점수 + 한국어 정책"에 달려 있음
- false positive가 많으면 CI 신뢰를 잃으므로 규칙 정밀도가 핵심 지표
