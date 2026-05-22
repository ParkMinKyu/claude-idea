# 063 - Git Stats (깃 저장소 기여 통계 대시보드)

## 개요
GitHub / GitLab 저장소를 연결하면 기여자별 커밋, 코드 라인, 파일, 시간대, 코드 hotspot, 버스 팩터 등 다양한 통계를 시각화하는 대시보드입니다. 매니저 / 테크 리드가 팀 활동을 한눈에 파악할 수 있습니다.

## 문제
- GitHub Insights는 기본 통계만 제공 (PR 사이클타임, hotspot 분석 약함)
- 멀티 리포 / 모노레포 통계 통합 어려움
- 기여자 객관 평가(인사) 시 데이터 부족
- 레거시 코드 hotspot 식별 도구 부재

## 솔루션
- **멀티 리포 대시보드**: 조직 단위 통합 통계
- **기여자 분석**: 커밋, 라인, PR, 리뷰 통계
- **시간대 / 요일 히트맵**: 팀 협업 패턴
- **Hotspot 분석**: 가장 자주 변경된 파일 (리팩토링 후보)
- **Bus factor**: 단일 기여자 의존 영역
- **PR 사이클타임**: open → review → merge 평균
- **번아웃 신호** (Pro): 야간/주말 커밋 추세

## 타겟
- 엔지니어링 매니저, 테크 리드
- 개발 팀 (회고 / 스프린트 리뷰)
- DevEx / 플랫폼 팀
- 오픈소스 메인테이너 (기여자 인정)

## 핵심 기능
1. **GitHub / GitLab OAuth**: 권한 위임
2. **로컬 분석 옵션** (CLI): simple-git으로 .git 직접 파싱
3. **시각화**: D3, Recharts (히트맵, 라인, 트리맵)
4. **Hotspot**: 변경 빈도 × 라인 수
5. **Bus factor**: 파일별 기여자 분산
6. **PR 메트릭**: 사이클타임, 리뷰 응답 시간
7. **export**: PDF 리포트 (월간)
8. **번아웃 알림** (Pro): 야간/주말 임계

## 수익 모델
- **오픈코어**: CLI / 분석 코어 MIT
- **Free**: 공개 리포 무제한, 비공개 1개
- **Pro ($15/사용자/월)**: 비공개 무제한, PDF 리포트
- **Team ($39/사용자/월)**: 조직 통합, SSO, 번아웃 알림
- **Enterprise**: 셀프호스팅 (사내 GitLab)

## 경쟁사
- GitHub Insights (기본)
- LinearB (강력하나 비쌈, $25/사용자)
- Pluralsight Flow (구 GitPrime, 매우 비쌈)
- Sleuth, Jellyfish
- gitstats (오픈소스 CLI, UI 약함)

## 차별점
- 가격 (LinearB의 절반 이하)
- 로컬 CLI 옵션 (데이터 외부 유출 없이도 사용 가능)
- 한국 기업용 (한국어, 토스 결제)
- Hotspot + Bus factor 일급 기능 (LinearB는 약함)
- 번아웃 신호 (윤리적 사용 가이드 포함)

## 로컬 CLI 사용 (Bitbucket / 사설 Git / 오프라인)

저장소 출처와 무관하게 로컬에 클론된 `.git` 폴더만 있으면 분석 가능합니다 — Bitbucket Cloud/Server, GitHub Enterprise, GitLab self-hosted, Gitea, Forgejo, 또는 외부 호스팅 없는 순수 로컬 저장소까지 동일하게 작동합니다.

### 한 번만 설치 (어디서든 사용)

```bash
git clone https://github.com/ParkMinKyu/claude-idea.git
cd claude-idea/ideas/063-git-stats
npm install -g .
```

→ 이후 **어느 폴더에서든** `git-stats` 명령으로 실행 가능.

### 사용 (가장 간단)

```bash
cd ~/myrepo      # 분석할 저장소로 이동
git-stats        # 끝. HTML 생성 + 브라우저 자동 열림
```

### 로컬 분석 서버 (브라우저에서 폴더 고르고 클릭)

CLI 인수 없이 브라우저 UI로 저장소를 고르고 싶다면:

```bash
git-stats serve              # localhost:7373 서버 실행 + 브라우저 자동 열림
git-stats serve --port=8080  # 포트 변경
```

브라우저에서 **폴더 둘러보기**로 홈 디렉터리부터 폴더를 탐색합니다. git 저장소엔 초록 `git` 배지가 붙습니다.

1. **저장소 클릭** → 그 저장소의 실제 브랜치 목록을 읽어 **분석 옵션 패널**이 나타남
2. 옵션 선택 — 브랜치 드롭다운(현재 HEAD 기본) / 모든 브랜치 합산 / 머지 커밋 포함
3. **[📊 분석]** → 서버가 `git log`를 파싱해 같은 페이지에 리포트(기여자·핫스팟·히트맵·기간 필터·드릴다운)를 그려줌

브랜치를 모르는 채로 옵션을 정할 필요 없이, 저장소를 고른 뒤 그 저장소에 실제로 존재하는 브랜치 중에서 선택합니다. 서버는 기본적으로 `127.0.0.1`에만 바인딩되어 외부에 노출되지 않습니다.

다른 폴더 분석:
```bash
git-stats ~/myrepo                     # 경로 지정
git-stats ~/myrepo --since=2025-01-01  # 기간 필터
```

옵션 (선택):
- `--since=YYYY-MM-DD` / `--until=YYYY-MM-DD` — 기간 필터
- `--branch=<name>` — 특정 브랜치
- `--top=<n>` — 핫스팟 상위 N개 (기본 20)
- `--out=<file>` — 출력 파일명 (기본: `git-stats-report.html`)
- `--no-open` — 브라우저 자동 열기 비활성화
- `--json` — JSON 출력 (stdout)
- `--pretty` — JSON 들여쓰기 (`--json`과 함께)

데이터는 외부로 나가지 않습니다. API 토큰도 불필요.

### 제거

```bash
npm uninstall -g git-stats
```

## KPI
- 연결된 리포 수
- 조직당 활성 사용자
- PDF 리포트 export 수 (제품 가치 지표)
- Free → Pro 전환율 (목표 5%, 매니저 결정권)
- 평균 분석 리포 크기
- 번아웃 알림 활성화 워크스페이스 수
