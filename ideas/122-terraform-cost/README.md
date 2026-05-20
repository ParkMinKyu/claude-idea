# 122 · Terraform 비용 예측기

## 개요
`terraform plan`의 JSON 출력을 파싱해 생성/변경/삭제될 리소스의 월간 클라우드 비용을 예측하고, PR에서 비용 차이(diff)를 보여주는 도구. Infracost의 가벼운 오픈코어 대체재를 지향한다.

## 문제
- 인프라 변경의 비용 영향이 청구서가 나오기 전까지 보이지 않는다.
- 리뷰어가 `m5.large` → `m5.4xlarge` 같은 변경의 비용 차이를 직관적으로 알기 어렵다.
- 클라우드 가격표는 방대하고 리전·인스턴스 타입별로 달라 수작업 계산이 비현실적이다.

## 솔루션
- `terraform show -json plan.out` 출력에서 `resource_changes`를 파싱
- 내장 가격 모델로 인스턴스/스토리지/데이터베이스의 월간 비용 계산
- 변경 전/후 비용을 비교해 월간 증감액(delta)을 산출
- PR 코멘트용 마크다운 테이블 및 JSON 리포트 생성

## 타겟 사용자
- IaC를 운영하는 DevOps/플랫폼 엔지니어
- 클라우드 비용을 관리해야 하는 스타트업 CTO
- FinOps 담당자

## 핵심 기능
1. **Plan JSON 파서** — create/update/delete 액션별 리소스 추출
2. **가격 모델** — EC2/RDS/EBS 등 주요 리소스의 시간당·월간 단가 매핑
3. **비용 diff** — before/after 상태의 월간 비용 차이 계산
4. **임계 게이트** — 월 증가액이 임계치를 넘으면 CI 실패
5. **마크다운 리포트** — PR 코멘트에 붙일 표 자동 생성

## 수익 모델
| 플랜 | 가격 | 가격 DB | 사용량 |
|---|---|---|---|
| OSS | $0 | 내장 정적 가격표 | 무제한 로컬 |
| Cloud | $25/월 | 실시간 가격 API | 10 워크스페이스 |
| Team | $99/월 | 멀티 클라우드 + 예산 알림 | 무제한 워크스페이스 |
| Enterprise | 문의 | 온프렘 가격 동기화, SSO | SLA |

## 경쟁사
- Infracost, Terraform Cloud(cost estimation), CloudHealth, Vantage

## 차별점
- 가격 모델을 순수 함수 + JSON 테이블로 분리해 사내 협상가(EA 할인) 반영이 쉬움
- 네트워크 없이 정적 가격표로 동작 → 폐쇄망 CI에서도 사용 가능
- 비용 diff를 회귀 게이트로 직접 활용 가능한 exit code 제공
- 한국 리전(ap-northeast-2) 가격 및 원화 환산 옵션 우선 지원

## 사용 예시
```bash
# plan JSON 생성 후 비용 추정
terraform plan -out=plan.out && terraform show -json plan.out > plan.json
npx tf-cost plan.json --threshold 100   # 월 +$100 초과 시 exit 1
```
출력 예: 마크다운 비용 diff 테이블 + `월간 증감: +345.6 USD`

## KPI
- 분석된 plan 수 / 월
- 평균 검출 비용 증가액
- 임계 게이트로 차단된 PR 수
- Cloud 플랜 전환율
- 가격 정확도 (실제 청구 대비 오차율)

## 로드맵
- **MVP (현재)**: plan JSON 파서, EC2/RDS/EBS 정적 가격, 비용 diff, 임계 게이트
- **v1**: AWS Price List API 동기화, GitHub PR 코멘트, 더 많은 리소스 타입
- **v2**: GCP/Azure 멀티 클라우드, 예약 인스턴스/Savings Plan 반영
- **v3**: 예산 알림, FinOps 대시보드, 사내 EA 할인 반영

## 리스크 & 가정
- 정적 가격표는 빠르게 낡으므로 자동 동기화가 신뢰성의 핵심
- Infracost(OSS)가 강력하므로 "한국 리전/원화/폐쇄망"이 차별 포인트
