# 063 - Git Stats (깃 저장소 기여 통계 분석기)

로컬 `.git` 폴더만으로 기여자·핫스팟·버스 팩터·시간대·**변경 결합도** 등을 분석해
인터랙티브 HTML 리포트로 보여주는 도구입니다.

- **의존성 0** — 시스템 `git`과 Node.js 빌트인만 사용 (`npm install -g .` 시 받는 외부 패키지 없음)
- **데이터가 외부로 나가지 않음** — 로컬에서만 동작, API 토큰 불필요
- **출처 무관** — GitHub/GitLab/Bitbucket/Gitea/사설 Git/오프라인 저장소 모두 동일하게 작동

> 아래 [향후 비전(SaaS)](#향후-비전-saas--미구현)은 아직 구현되지 않은 계획입니다.
> 지금 이 저장소에 실제로 있는 것은 이 로컬 CLI + 로컬 분석 서버입니다.
> 구현 vs 비전 구분은 `TECH_STACK.md` 참고.

---

## 설치

```bash
git clone https://github.com/ParkMinKyu/claude-idea.git
cd claude-idea/ideas/063-git-stats
npm install -g .
```

→ 이후 **어느 폴더에서든** `git-stats` 명령으로 실행. (Node.js 18+ 필요)

## 사용

### ① 가장 간단 — 현재 폴더 분석

```bash
cd ~/myrepo
git-stats          # HTML 리포트 생성 + 브라우저 자동 열림
```

다른 폴더 / 옵션:
```bash
git-stats ~/myrepo --since=2025-01-01     # 기간 필터
git-stats ~/myrepo --json > stats.json    # JSON 출력
```

| 옵션 | 설명 |
|------|------|
| `--since=YYYY-MM-DD` / `--until=YYYY-MM-DD` | 기간 필터 |
| `--branch=<name>` | 특정 브랜치 (기본: 현재 HEAD) |
| `--all` | 모든 브랜치 합산 |
| `--include-merges` | 머지 커밋 포함 (기본: 제외) |
| `--top=<n>` | 핫스팟 상위 N개 (기본 20) |
| `--out=<file>` | 출력 파일명 |
| `--no-open` | 브라우저 자동 열기 비활성화 |
| `--json` / `--pretty` | JSON 출력 / 들여쓰기 |

### ② 로컬 분석 서버 — 브라우저에서 폴더 고르고 클릭

**전역 설치했다면** 어느 폴더에서든:
```bash
git-stats serve              # localhost:7373 + 브라우저 자동 열림
git-stats serve --port=8080  # 포트 변경
```

**설치 없이** 이 폴더(`ideas/063-git-stats`)에서 바로 (Node.js 18+만 있으면 됨):
```bash
node bin/git-stats.mjs serve     # 또는
npm run serve                    # = node bin/git-stats.mjs serve
npm run serve -- --port=8080     # npm 스크립트에 옵션 전달 시 -- 필요
```

실행하면 `http://127.0.0.1:7373` 가 브라우저에 자동으로 열립니다(안 열리면 직접 접속).
종료는 `Ctrl+C`. 브라우저에서 **폴더 둘러보기**로 탐색 → git 저장소(초록 `git` 배지) 클릭 →
그 저장소의 실제 브랜치 목록을 읽어 **분석 옵션 패널**이 뜸 → 옵션 선택 후 **[📊 분석]** → 같은 페이지에 리포트.

서버는 `127.0.0.1`에만 바인딩되고 Host/Origin을 검증해 외부에 노출되지 않습니다.

### 제거
```bash
npm uninstall -g git-stats
```

---

## 리포트에 담기는 지표 (전부 git 로그만으로 산출)

리포트는 **요약 / 커밋 상세 / 기여자 상세 / 파일 상세 / 결합도 탐색** 5개 탭으로 구성되고,
상단 기간 필터는 모든 탭에 공통 적용됩니다(탭 전환해도 유지).

- **커밋 활동 추이** — 월별 커밋 막대 (빈 달도 표시, KST 기준)
- **기여자 순위** — 커밋/라인/파일/최근활동 정렬, 기여자별 미니 히트맵
- **커밋 목록** — 최신순, 메시지·작성자·해시 검색 + 페이지네이션
- **시간대 히트맵** — 요일×시간 (KST), 셀 클릭 시 해당 시간대 커밋 드릴다운
- **핫스팟** — 가장 자주 수정된 파일 (리팩토링·버그 위험)
- **버스 팩터 + 파일 소유 위험** — 단 한 명만 만진 파일(이탈 위험)과 그 소유자
- **변경 결합도** — "A가 바뀌면 B도 바뀔 확률(강도%)" + 핫스팟 교차로 리팩토링 우선순위.
  강결합(80%+) 강조. **네트워크 그래프**(노드=파일/크기=변경빈도, 선=결합/굵기=강도, God file 식별, 드래그)
- **결합도 탐색 탭** — 폴더 트리에서 파일을 고르면 함께 바뀐 파일을 강도순으로(양방향 강도 표시)
- **고아 파일** — 현존하지만 오래 방치된 파일 (죽은 코드 후보)
- **커밋 크기 분포 / 메시지 컨벤션 / 언어 분포 / 기여자 타임라인**

> 대형 저장소(수만 커밋)는 서버 모드 권장: 집계가 서버에서 이뤄지고 카드/그래프는 상위 N개만
> 렌더해 빠릅니다. CLI 단일 HTML 파일은 오프라인 자체완결이지만 고아 파일 등 일부 지표는 서버 모드 전용.

## 개발 / 테스트

```bash
npm test         # node --test (의존성 0, 설치 불필요)
```

핵심 집계 로직(`lib/core.mjs`)을 `tests/core.test.mjs`가 검증합니다.
구조: `lib/core.mjs`(파싱·집계) · `render.mjs`(HTML) · `style.mjs`(CSS) ·
`client-runtime.mjs`(브라우저 런타임) · `format.mjs`(헬퍼) · `bin/`(CLI·서버).

---

## 향후 비전 (SaaS — 미구현)

아래는 이 도구를 제품화할 경우의 방향입니다. **현재 저장소에는 구현되어 있지 않습니다.**
특히 PR 사이클타임·리뷰 메트릭·배포 빈도(DORA)는 git 로그만으로는 불가능하며 GitHub/GitLab API가 필요합니다.

### 솔루션 (목표)
- 멀티 리포 / 조직 단위 통합 대시보드
- GitHub / GitLab OAuth 연동
- PR 사이클타임(open→review→merge), 리뷰 응답 시간
- 번아웃 신호 (야간/주말 추세) — 윤리적 사용 가이드 포함
- 월간 PDF 리포트 export

### 수익 모델 (목표)
- **오픈코어**: CLI / 분석 코어 MIT (← 지금 구현된 부분)
- **Free**: 공개 리포 무제한, 비공개 1개
- **Pro ($15/사용자/월)**: 비공개 무제한, PDF 리포트
- **Team ($39/사용자/월)**: 조직 통합, SSO, 번아웃 알림
- **Enterprise**: 셀프호스팅 (사내 GitLab)

### 경쟁사 / 차별점
- 경쟁: LinearB($25/사용자), Pluralsight Flow(구 GitPrime), Jellyfish, Sleuth, gitstats(OSS)
- 차별: 가격(LinearB 절반 이하) · 로컬 CLI(데이터 유출 없음) · 한국 기업용(한국어/토스) ·
  Hotspot + Bus factor + 변경 결합도 일급 기능
