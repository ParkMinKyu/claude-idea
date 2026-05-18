# Tech Stack — Pomodoro Tray

## 플랫폼
- Electron 30+
- macOS, Windows, Linux

## 언어 & 빌드
- TypeScript 5 strict
- tsc → CommonJS for main
- electron-builder

## Main process
- `Tray` + `nativeImage` (메뉴바 타이머)
- `Menu.buildFromTemplate` 컨텍스트 메뉴
- `Notification` (네이티브 알림)
- `powerMonitor` (시스템 sleep 감지)

## Renderer (popup window)
- 작은 frameless 윈도우 (시작/스킵, 라벨 입력)
- 통계 페이지 (canvas 또는 svg)

## 저장
- JSON 파일 (`~/Library/Application Support/PomodoroTray/data.json`)
- 또는 better-sqlite3 (확장성)
- 본 MVP는 JSON으로 간단히 시작

## IPC
- contextBridge로 안전한 API

## 테스트
- Vitest
- 타이머 로직, 통계 집계 단위 테스트

## 디렉토리
```
src/
  main/
    index.ts
    tray.ts
    timer.ts
    stats.ts
    store.ts
  preload/index.ts
  renderer/
    index.html
    app.ts
package.json
tests/
```

## 알림
- 시스템 알림 (작업 시작/종료)
- 사운드: 로컬 wav 파일 (커스텀 가능, Pro)

## 자동 시작
- electron `app.setLoginItemSettings`
