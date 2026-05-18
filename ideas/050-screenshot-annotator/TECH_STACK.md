# Tech Stack — Screenshot Annotator

## 플랫폼
- Chrome Extension MV3

## 언어 & 빌드
- TypeScript 5 strict
- esbuild
- pnpm

## 캡처
- `chrome.tabs.captureVisibleTab` — 보이는 영역
- Full-page: content script가 스크롤하며 여러 장 캡처 → canvas 합성
- 클립보드: `navigator.clipboard.write(new ClipboardItem(...))`

## 에디터
- HTML5 Canvas, 순수 DOM (라이브러리 없음 → 번들 < 50KB)
- 도형: Annotation 객체 배열 → 매 프레임 redraw
- Undo/Redo: command stack

## 클라우드 (Pro)
- Cloudflare Workers + R2 (이미지 저장)
- 단축 URL 6자 base62
- 만료 옵션 (7일/30일/영구)

## 결제
- ExtPay 또는 Stripe Checkout

## 테스트
- Vitest
- Annotation 직렬화/도형 충돌 단위 테스트
- canvas mock

## 디렉토리
```
src/
  background.ts
  popup.html / popup.ts
  editor.html / editor.ts
  lib/annotations.ts
  lib/capture.ts
  lib/render.ts
manifest.json
tests/
```

## 보안 / 프라이버시
- 이미지는 디폴트로 로컬에만 저장
- Pro 업로드 시 명시적 동의
- 만료 지난 이미지는 자동 삭제 (R2 lifecycle)
