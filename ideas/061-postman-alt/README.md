# 061 - Postman Alternative (가벼운 API 클라이언트)

## 개요
Postman 대비 10분의 1 무게, 시작 1초의 가벼운 데스크탑 API 클라이언트입니다. Tauri로 빌드되어 50MB 미만이며, 로컬 우선(local-first)으로 모든 컬렉션이 디바이스에 저장됩니다. Git 동기화로 팀 공유가 가능합니다.

## 문제
- Postman이 무겁고(>500MB), 가입 강제, 클라우드 종속으로 변함
- Insomnia는 Kong 인수 후 라이선스 모델 불안정
- 컬렉션이 독점 포맷이라 Git 친화적이지 않음
- 보안에 민감한 회사는 클라우드 동기화 거부

## 솔루션
- **Tauri**: Rust 백엔드 + 웹뷰 (Electron보다 10x 가벼움)
- **Local-first**: 모든 데이터는 로컬 SQLite
- **Git 동기화**: 컬렉션은 사람이 읽기 쉬운 YAML 파일
- **OpenAPI import**: 즉시 컬렉션 생성
- **환경 변수**: 환경별 (`local`, `staging`, `prod`)
- **gRPC / WebSocket / GraphQL** 지원

## 타겟
- 백엔드 개발자 (REST / gRPC 디버깅)
- QA 엔지니어
- 보안 민감 기업 (데이터 외부 유출 금지)
- Postman 가입/요금에 지친 개인 개발자

## 핵심 기능
1. **HTTP 클라이언트**: REST, GraphQL, gRPC, WebSocket
2. **컬렉션**: 폴더 트리, 환경 변수
3. **Git 동기화**: YAML 포맷, PR 리뷰 가능
4. **스크립트**: pre-request / post-response (JS)
5. **OpenAPI import / export**
6. **목 응답 캡처**: 한 번 호출 후 저장된 응답 재사용
7. **팀 워크스페이스** (Pro, 옵션): 클라우드 sync 백업
8. **CLI** (`papi run`): CI에서 컬렉션 실행

## 수익 모델
- **오픈코어**: 데스크탑 앱 무료 (MIT)
- **Pro ($8/월)**: 클라우드 백업, 팀 공유 동기화 (E2E)
- **Team ($25/사용자/월)**: SSO, 권한 관리, CI 무제한 실행
- **Enterprise**: 셀프호스팅, SSO/SAML
- 수익원 추가: 마켓플레이스 (커뮤니티 컬렉션, 유료 템플릿)

## 경쟁사
- Postman (강력하나 무거움)
- Insomnia (Kong 인수 후 불신)
- Bruno (Git 우선, 좋은 경쟁자)
- Hoppscotch (웹 기반, 가볍지만 데스크탑 약함)
- HTTPie Desktop

## 차별점
- Tauri 기반 < 50MB (Postman 500MB+)
- Git 우선 + YAML (Bruno와 유사하나 한국어 UX, gRPC 더 강력)
- 한국 기업용 (오프라인, 결제 토스/카카오)
- CLI 일급 시민 (CI 통합)
- 익명 사용 가능 (가입 강제 없음)

## KPI
- 다운로드 수 (월별)
- 일간 활성 사용자 (텔레메트리 옵트인)
- 컬렉션 평균 요청 수
- Free → Pro 전환율 (목표 1.5%, 데스크탑이라 낮음)
- GitHub 스타 (오픈소스 신뢰 지표)
- CLI 다운로드 / CI 실행 수
