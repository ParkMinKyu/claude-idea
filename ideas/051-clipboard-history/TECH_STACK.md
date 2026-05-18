# Tech Stack — Clipboard History

## 플랫폼
- Electron 30+
- macOS / Windows / Linux

## 언어 & 빌드
- TypeScript 5
- electron-builder for packaging
- electron-vite for renderer + main bundling
- pnpm

## Main process
- `electron.clipboard` — text, image, html, files 폴링
- `globalShortcut` — 글로벌 단축키
- `Tray` + `BrowserWindow` (frameless, alwaysOnTop)
- `nativeImage` for thumbnails

## Renderer
- Preact (가벼움) 또는 vanilla TS
- Tailwind 또는 plain CSS
- 검색은 클라이언트 측 fuse.js / 단순 substring + tokenisation

## 저장
- better-sqlite3 (동기 SQLite, FTS5)
- `~/Library/Application Support/ClipboardHistory/data.db`
- 이미지: 별도 폴더, DB에는 경로

## IPC
- `ipcMain.handle` ↔ `ipcRenderer.invoke`
- contextBridge로 안전한 API 노출

## 보안
- `contextIsolation: true`, `nodeIntegration: false`
- 비밀번호 매니저 출력 감지: 짧고 영숫자만, 길이 8~32
- 시크릿 정규식 (AWS 키, 카드번호) 자동 필터

## 테스트
- Vitest (main 로직 단위)
- 검색/저장 로직 분리해서 테스트 가능하게 작성

## 디렉토리
```
src/
  main/
    index.ts            # Electron main
    tray.ts
    clipboard-watcher.ts
    db.ts
    shortcuts.ts
  renderer/
    index.html
    app.ts
  preload/
    index.ts
package.json
tests/
```
