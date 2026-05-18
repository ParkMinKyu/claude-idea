# Tech Stack · 086 Tab Todo

## 확장 프로그램
- **Chrome Extension Manifest V3** — `chrome_url_overrides.newtab` 으로 새 탭 가로채기
- **Vanilla TypeScript + Vite** — 번들 < 30KB, 의존성 최소화
- **chrome.storage.sync** — 디바이스 간 자동 동기화 (100KB 한도)
- **chrome.alarms** — 자정마다 "오늘" 리스트 롤오버

## UI
- **HTML + CSS Variables** — 다크/라이트 자동 (prefers-color-scheme)
- **No framework** — 새 탭 렌더링 지연 최소화가 최우선
- **System fonts** — 폰트 로딩 지연 회피

## 도메인 로직
- 순수 함수 모듈 (`todoStore.ts`) — 테스트 가능
- 반복 규칙은 cron-like 문법 대신 요일 비트마스크로 단순화

## 클라우드 (Pro)
- **Next.js API Routes** — `/api/sync` 엔드포인트
- **Supabase Postgres** — `todos`, `users`, `devices`
- **Clerk** — Google OAuth

## 테스트
- **Vitest** — 도메인 로직 단위 테스트
- **jsdom** — DOM 렌더링 스모크 테스트
- 수동 QA: Chrome/Edge/Brave 최신 버전

## 배포
- Chrome Web Store, Edge Add-ons, Firefox AMO
- GitHub Actions로 zip 빌드 + 자동 업로드 (`chrome-webstore-upload-cli`)
