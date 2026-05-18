# 기술 스택 - 061 Postman Alternative

## 데스크탑 셸
- **Tauri 2** - Rust 백엔드 + 시스템 웹뷰
- 번들 크기 < 50MB (Electron 대비 10x 작음)
- macOS / Windows / Linux 단일 코드베이스

## 프론트엔드
- **React 18** + **TypeScript**
- **Vite** - 개발 서버
- **Tailwind CSS** + **shadcn/ui**
- **CodeMirror 6** - 요청 본문 편집기
- **Zustand** - 상태 관리

## HTTP 엔진
- Tauri 명령으로 Rust **reqwest** 호출 (브라우저 CORS 우회)
- gRPC: **tonic** (Rust)
- WebSocket: **tokio-tungstenite**

## 로컬 저장소
- **SQLite** (rusqlite) - 컬렉션, 환경, 히스토리
- 파일 sync 시 **YAML** export

## Git 동기화
- **git2-rs** - 임베디드 Git 클라이언트
- 또는 시스템 `git` 호출 (CLI 사용자 선호도)

## 스크립트 엔진
- **deno_core** 또는 **boa_engine** (Rust JS 런타임)
- Pre-request / Post-response 스크립트

## CLI
- **clap** (Rust) - `papi run collection.yaml`
- 같은 코어 로직 공유

## 클라우드 백업 (Pro, 옵션)
- 별도 Next.js 백엔드
- E2E 암호화 (libsodium)
- **PostgreSQL** + **S3**

## 테스트
- **vitest** - React UI
- **cargo test** - Rust 코어
- **Playwright + tauri-driver** - E2E

## CI/CD
- **GitHub Actions** - 멀티 플랫폼 빌드
- 자동 코드 사이닝 (macOS notarization, Windows EV cert)

## 모니터링 (옵트인)
- 익명 사용 지표
- **Sentry** (옵트인)

## 패키징
- `.dmg` (macOS), `.msi` (Windows), `.AppImage` / `.deb` (Linux)
- **Homebrew**, **winget**, **Snapcraft** 배포
