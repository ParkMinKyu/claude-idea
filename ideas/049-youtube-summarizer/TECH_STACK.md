# Tech Stack — YouTube Summarizer

## 플랫폼
- Chrome Extension MV3

## 언어 & 빌드
- TypeScript 5 strict
- esbuild
- pnpm

## 자막 추출
- YouTube의 timedtext API:
  `https://www.youtube.com/api/timedtext?v=VIDEO_ID&lang=en`
- 페이지에서 `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` 파싱
- XML or JSON3 포맷 파싱

## AI
- @anthropic-ai/sdk
- Claude Sonnet 4.7 (기본) / Opus 4.7 (Pro)
- Prompt caching: 시스템 프롬프트 (요약 가이드라인) 캐싱
- 스트리밍 응답으로 UX 향상

## UI
- 영상 페이지에 사이드패널 주입 (content script + iframe)
- 또는 popup.html (압축 보기)
- preact 또는 순수 DOM (번들 사이즈 최소화)

## 저장
- `chrome.storage.local`: 최근 요약 50개
- API 키는 `chrome.storage.sync`에 저장 (사용자 옵션)

## 테스트
- Vitest
- 트랜스크립트 파서 단위 테스트
- Anthropic SDK mock

## 디렉토리
```
src/
  background.ts       # API 호출 (CORS 우회용)
  content.ts          # 영상 페이지에 버튼 주입
  popup.html / popup.ts
  options.html / options.ts
  lib/transcript.ts
  lib/summarize.ts
  lib/storage.ts
manifest.json
tests/
```

## 보안
- API 키는 클라이언트 storage.sync (E2E 암호화는 아님)
- BYOK 모드 권장 (사용자가 비용 직접 통제)
- 트랜스크립트는 임시 메모리만, 결과만 저장
