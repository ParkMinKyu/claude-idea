# Tech Stack · 089 Time Tracker

## 데스크톱
- **Electron 30** — 메인 프로세스 + 트레이 only (창 없음 기본)
- **active-win** — 활성 창 감지 (macOS Accessibility, Windows WMI, Linux X11/xdotool)
- **electron-store** — 환경설정
- **better-sqlite3** — 로컬 이벤트 저장

## 트레이 UI
- **Vanilla HTML/CSS** — 트레이 팝오버 단순화
- **Chart.js** — 일일 차트

## 도메인 로직
- 폴링: 5초마다 active-win + idle 시간 측정
- 합산: 같은 (앱, 제목)이 연속이면 단일 세그먼트로 병합
- 카테고리: 규칙 엔진 `[{ match: /code/i, category: "code" }]`

## 클라우드 (Pro)
- **Next.js + Hono** API
- **Postgres** (Neon)
- **Clerk** + **Stripe**

## 브라우저 확장
- MV3로 활성 탭 URL을 데스크톱 앱(WebSocket localhost)으로 전달

## 테스트
- **Vitest** — 분류기, 세그먼트 병합 로직
- 통합 테스트: in-memory adapter

## 빌드/배포
- **electron-builder** — DMG, MSI, AppImage
- 자동 업데이트: GitHub Releases + electron-updater
- Notarization (macOS), Authenticode (Windows)

## 개발 도구
- TypeScript, ESLint, pnpm
