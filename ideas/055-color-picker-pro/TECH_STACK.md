# Tech Stack — Color Picker Pro

## 플랫폼
- 듀얼 패키지:
  - Chrome Extension MV3
  - Electron 데스크톱 앱
- 공통 lib (색 변환/팔레트)을 `src/lib/`에 두고 양쪽이 import

## 언어 & 빌드
- TypeScript 5 strict
- esbuild (extension), tsc (electron main)
- pnpm workspaces (가능 시)

## Chrome Extension
- EyeDropper API (Chromium 95+) — popup에서 픽업
- 페이지 요소 hover hex 표시 (content script + overlay)

## Electron
- `desktopCapturer` + canvas 픽셀 추출 (전체 화면 픽업)
- `globalShortcut` 단축키 (Cmd/Ctrl+Shift+P)
- `Tray` + 팔레트 윈도우

## 색 변환
- 직접 구현: hex ↔ rgb ↔ hsl ↔ hsv ↔ oklch
- WCAG 대비 계산

## 팔레트 저장
- chrome.storage.local (extension)
- ~/.color-picker-pro/data.json (electron)
- Pro 동기화: Cloudflare D1 + ID

## 테스트
- Vitest
- 색 변환, 대비, 팔레트 직렬화 단위 테스트

## 디렉토리
```
src/
  lib/color.ts           # 변환/대비 (공통)
  lib/palette.ts         # 팔레트 자료구조 (공통)
  ext/manifest.json
  ext/background.ts
  ext/popup.html / popup.ts
  ext/content.ts
  electron/main.ts
  electron/preload.ts
  electron/renderer/
package.json
tests/
```
