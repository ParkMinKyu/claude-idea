# TECH STACK · 122 Terraform 비용 예측기

## 언어 / 런타임
- **Node.js 20+** (ESM) — CI 친화적, JSON 처리에 강함
- 외부 의존성 0 (코어는 표준 라이브러리만 사용)

## 코어 아키텍처
- `src/parser.js` — `terraform show -json` 출력에서 `resource_changes` 추출, 액션(create/update/delete) 정규화
- `src/pricing.js` — 정적 가격표(JSON) + 리소스별 월간 비용 계산 순수 함수
- `src/estimate.js` — 파서 + 가격 모델 결합, before/after 비용 diff 산출
- `src/report.js` — 마크다운 테이블 / JSON 리포트 생성
- `src/cli.js` — 파일 입력, 임계 게이트, exit code

## 가격 모델
- 시간당 단가 → 월간(730시간) 환산
- 지원 리소스(MVP): `aws_instance`(EC2), `aws_db_instance`(RDS), `aws_ebs_volume`(EBS)
- 미지원 리소스는 비용 0 + `unsupported` 플래그로 표시

## 데이터 소스
- MVP: 코드 내장 정적 가격표 (us-east-1, ap-northeast-2 일부)
- 프로덕션: AWS Price List API 주기 동기화 → S3 캐시

## 테스트
- **vitest** — 파서, 가격 계산, diff 로직을 픽스처 JSON으로 오프라인 검증

## 임계 게이트
- `--threshold <USD>`: 월 증가액이 임계치를 초과하면 exit code 1

## 배포 / 인프라 (프로덕션 계획)
- CLI: npm 패키지
- SaaS: Vercel(대시보드) + GitHub App(PR 코멘트)
- 가격 동기화 워커: 일 1회 cron (Cloudflare Workers)

## 확장 계획
- GCP/Azure 가격 모델 추가
- 예약 인스턴스/Savings Plan 반영
- 원화 환산 및 한국 리전 우선
