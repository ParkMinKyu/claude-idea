# 기술 스택 - 063 Git Stats

> ⚠️ 이 문서는 두 부분으로 나뉩니다. **A. 현재 구현**이 실제 코드이고,
> **B. SaaS 비전**은 아직 구현되지 않은 향후 계획입니다.

---

## A. 현재 구현 (실제 코드 — 의존성 0)

핵심 원칙: **런타임 npm 의존성 0**. 시스템 `git`과 Node.js 빌트인만 사용합니다.
`npm install -g .` 시 받아오는 외부 패키지가 없습니다.

### 코어 (`lib/`)
- **Node.js (`node:` 빌트인만)** — `child_process`(execFileSync로 git 호출), `http`, `fs`, `os`, `path`
- **시스템 `git`** — `git log --numstat -M`, `git ls-files`, `git for-each-ref` 등
- `lib/core.mjs` — git 로그 파싱 + 모든 집계(기여자·핫스팟·버스팩터·결합도·고아·언어 등)
- `lib/render.mjs` — HTML 조각 렌더 + 페이지 골격
- `lib/style.mjs` — CSS (Tailwind/shadcn 아님, 손수 작성)
- `lib/client-runtime.mjs` — 브라우저 런타임(필터·정렬·드릴다운·탭·force 그래프). `.toString()`으로 직렬화해 인라인
- `lib/format.mjs` — 공용 포맷 헬퍼

### 시각화
- **손수 작성한 SVG** — 네트워크 force 그래프, 히트맵, 막대는 D3/Recharts 없이 직접 구현
- 차트 라이브러리 없음 (CSS + SVG + 순수 JS)

### 서버 / CLI (`bin/`)
- `bin/git-stats.mjs` — CLI 진입점 (analyze / serve / --json)
- `bin/serve.mjs` — `node:http` 로컬 분석 서버. 127.0.0.1 바인딩 + Host/Origin 검증
- 메모리 LRU 캐시 (커밋 배열 · tracked 파일)

### 테스트
- **`node:test`** (빌트인) — `node --test tests/*.test.mjs`. 설치 불필요
- `tests/core.test.mjs` — 집계 로직 검증 (24개)

### 보안
- git 인자 주입 차단(safeRevision/safeDate), Host/Origin 화이트리스트, HTML escape
- 데이터가 로컬 머신 밖으로 나가지 않음. API 토큰 불필요

---

## B. SaaS 비전 (미구현 — 향후 계획)

아래는 README의 수익화 비전을 실현할 경우의 목표 아키텍처입니다.
**현재 저장소에는 구현되어 있지 않습니다.**

- **프론트엔드**: Next.js + React + Tailwind, Recharts/D3
- **백엔드**: Route Handlers, GitHub/GitLab API(@octokit, @gitbeaker), BullMQ + Redis 워커
- **DB**: PostgreSQL(Supabase) + Prisma, 시계열은 TimescaleDB
- **인증**: NextAuth (GitHub/GitLab OAuth)
- **결제**: Stripe / 토스
- **PDF**: @react-pdf/renderer
- **배포**: Vercel(웹) + Render(워커)
- **모니터링**: Sentry, PostHog

> 참고: PR 사이클타임·리뷰 메트릭·배포 빈도(DORA) 등은 git 로그만으로는
> 산출 불가하며 GitHub/GitLab API 연동이 필요합니다(B 단계).
