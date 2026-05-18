# Tech Stack — Window Manager

## 플랫폼
- Electron 30+
- macOS, Windows, Linux (X11/Wayland 제한적)

## 언어 & 빌드
- TypeScript 5 strict
- tsc → CommonJS
- electron-builder
- pnpm

## 윈도우 조작
- macOS: AppleScript / `osascript` 또는 `node-mac-window` (네이티브)
- Windows: `node-window-manager` (npm 패키지)
- Linux X11: `wmctrl` 외부 명령
- 본 MVP는 OS 추상화 인터페이스만 정의 (실제 호출은 어댑터)

## 핫키
- Electron `globalShortcut`
- 사용자 정의 (renderer 설정 화면 → main에 IPC)

## 트레이
- Tray + Menu (시작/설정/종료)
- BrowserWindow 옵션 페이지

## 저장
- JSON config in `app.getPath("userData")`
- 핫키 매핑, 사용자 그리드

## 테스트
- Vitest
- 레이아웃 계산 함수 단위 테스트 (모니터 사이즈 입력 → 윈도우 bounds 출력)

## 디렉토리
```
src/
  main/
    index.ts
    layouts.ts        # geometry calculations
    adapter.ts        # OS interface
    shortcuts.ts
    config.ts
  preload/index.ts
  renderer/
    settings.html
    settings.ts
package.json
tests/
```
