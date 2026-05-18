# 058 - API Mocker (빠른 API 모킹 서비스)

## 개요
프론트엔드 / 모바일 개발자가 백엔드 API 완성 전에 즉시 사용할 수 있는 모의 API 엔드포인트를 30초 만에 생성하는 SaaS입니다. 스키마 기반 fake 데이터 자동 생성, 지연/에러 시뮬레이션, 요청 로그를 제공합니다.

## 문제
- 백엔드 미완성 상태에서 프론트 작업 블로킹
- 로컬 mock 서버(MSW, JSON Server)는 설정과 유지 관리 비용
- 디자이너/PM이 프로토타입 데모를 위해 백엔드 의존
- 네트워크 에러, 느린 응답 등 엣지 케이스 시뮬레이션 어려움

## 솔루션
- 30초 생성: `POST /projects` → 즉시 `https://m.api/{slug}` 발급
- 스키마 정의 (JSON Schema / OpenAPI) → fake 데이터 자동 생성 (faker)
- 응답 지연(ms), 에러율(%), 임의 5xx 시뮬레이션
- 요청 로그 실시간 스트리밍 (headers / body / timing)
- CLI: `mocker init`, `mocker push openapi.yaml`
- 팀 워크스페이스 (Pro): 권한, 버전, 환경 분리 (dev/staging)

## 타겟
- 프론트엔드 / 모바일 개발자
- API 디자인을 먼저 하는 백엔드 팀
- 프로토타이핑하는 디자이너 / PM
- 교육 / 부트캠프 (학습용)

## 핵심 기능
1. **즉시 엔드포인트 생성**: 슬러그 기반 고유 URL
2. **동적 응답**: JSON Schema 또는 정적 fixture
3. **Fake 데이터**: faker.js 통합 (이름, 이메일, 주소, lorem)
4. **지연 / 에러**: 글로벌 + 엔드포인트별 설정
5. **요청 로그**: 최근 100개 (Free), 무제한 (Pro)
6. **WebSocket 모킹** (Pro)
7. **OpenAPI import / export**
8. **팀 워크스페이스, RBAC** (Pro)

## 수익 모델
- **오픈코어**: 단일 사용자 셀프호스팅 MIT
- **Free**: 프로젝트 3개, 엔드포인트 50개, 일 10K 요청
- **Pro ($15/월)**: 무제한 프로젝트, 일 100K 요청, WebSocket
- **Team ($49/월, 5인)**: SSO, 환경 분리, 감사 로그
- **Enterprise**: 셀프호스팅, VPC

## 경쟁사
- Mockoon (데스크탑 위주)
- Postman Mock (Postman 종속)
- Beeceptor (UI 구식, 가격 비쌈)
- MSW (라이브러리, 호스팅 없음)

## 차별점
- 30초 생성 (가입 없이 anonymous 프로젝트)
- 한국 리전 응답 < 50ms (도쿄/서울 PoP)
- OpenAPI ↔ 모킹 양방향 (스키마 우선 개발)
- 임의 시드 fake 데이터 (재현 가능한 응답)
- CLI 우선 워크플로우 (Git 친화)

## KPI
- 익명 프로젝트 → 가입 전환율
- 일 평균 요청 수 (제품 적합성)
- 프로젝트당 엔드포인트 수
- Free → Pro 전환율 (목표 2.5%)
- WebSocket / OpenAPI 기능 사용률
- CLI 설치 수
