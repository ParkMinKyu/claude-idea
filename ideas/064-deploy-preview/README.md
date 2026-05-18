# 064 - Deploy Preview (PR 프리뷰 자동 배포)

## 개요
GitHub Pull Request마다 자동으로 임시 환경(`pr-123.preview.example.com`)을 띄워주는 셀프호스팅 가능한 PaaS입니다. Vercel/Netlify가 정적 사이트나 Next.js만 지원하는 반면, 임의의 Docker 이미지(Django, Rails, Go 백엔드 포함)를 지원합니다.

## 문제
- Vercel/Netlify는 백엔드 / 데이터베이스 포함 풀스택 프리뷰 약함
- 자체 구현은 복잡 (Kubernetes + ArgoCD + ingress 설정)
- PR마다 수동 배포는 리뷰어가 코드 변경을 실제로 확인하지 않게 만듦
- staging 환경 공유로 인한 conflict (여러 PR 동시 테스트 불가)

## 솔루션
- **GitHub App 설치 → 자동 배포**: PR open/sync 시 즉시 환경 생성
- **임의 Dockerfile 지원**: Django, Rails, Go, .NET 등
- **docker-compose 지원**: DB + 백엔드 + 프론트 동시
- **격리된 데이터베이스**: PR별 ephemeral DB (seed 자동)
- **PR 코멘트**: URL, 빌드 로그 링크 자동 게시
- **자동 정리**: PR close 시 환경 파괴
- **세션 공유**: 디자이너 / QA가 같은 URL로 접근

## 타겟
- 풀스택 개발 팀 (5-100명)
- QA / 디자인 협업 필요한 조직
- 백엔드 변경이 잦은 SaaS 회사
- 셀프호스팅 선호하는 보안 민감 조직

## 핵심 기능
1. **GitHub webhook 수신**: PR 이벤트 처리
2. **빌드 파이프라인**: Dockerfile / Compose 빌드
3. **동적 라우팅**: 와일드카드 ingress + 자동 DNS
4. **TLS 자동화**: Let's Encrypt 와일드카드
5. **DB seed**: 템플릿 SQL / 스냅샷
6. **자동 정리**: PR close webhook
7. **로그 / 메트릭**: 빌드 + 런타임
8. **Slack 알림** (Pro)

## 수익 모델
- **오픈코어**: 셀프호스팅 코어 MIT
- **Cloud Free**: 활성 PR 1개, 빌드 50/월
- **Cloud Pro ($29/월)**: 활성 PR 10개, 무제한 빌드
- **Team ($99/월)**: PR 50개, SSO, RBAC
- **Enterprise**: 셀프호스팅 지원 계약, SLA

## 경쟁사
- Vercel Preview (프론트엔드만 강력)
- Render Preview Environments (풀스택, 좋은 경쟁자)
- Heroku Review Apps (오래됨, 비쌈)
- Coolify (셀프호스팅, 좋은 경쟁자)
- Cloudflare Pages

## 차별점
- 임의 Docker 지원 (Vercel은 Next.js 위주)
- 셀프호스팅 + 클라우드 동일 코드
- docker-compose 일급 시민 (DB 동시 배포)
- 한국 리전 (도쿄/서울 PoP)
- 한국 기업용 결제, 한국어 지원

## KPI
- 설치된 GitHub App 수
- 월간 배포된 PR 수
- 평균 빌드 시간 (목표 < 90초)
- Free → Pro 전환율 (목표 4%)
- 평균 환경 수명 (PR 사이클타임 지표)
- 셀프호스팅 다운로드 수
