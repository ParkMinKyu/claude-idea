# Tech Stack — ReadLater TTS

## 플랫폼
- Chrome Extension Manifest V3
- Chromium 기반 브라우저 + 안드로이드 Chrome (옵션)

## 언어 & 빌드
- TypeScript 5.x strict
- esbuild로 번들
- pnpm

## 본문 추출
- @mozilla/readability — 페이지 본문/제목 추출
- DOMPurify — XSS 방어
- 사용자 정의 selector 오버라이드 (Pro)

## TTS
- 무료: Web Speech API (`window.speechSynthesis`)
- Pro: 백엔드 프록시 → Azure Cognitive Services Speech or ElevenLabs
  - Why proxy? API 키 보호, 사용량 미터링, 결제 연동

## 백엔드 (Pro만)
- Hono on Cloudflare Workers
- D1 (사용량/구독)
- Stripe Webhook
- R2 (MP3 캐시)

## 큐 / 동기화
- `chrome.storage.local` (Free)
- `chrome.storage.sync` (Pro, 기기 간)

## 테스트
- Vitest
- happy-dom (Readability 테스트용)

## 디렉토리
```
src/
  content/extract.ts        # readability 래퍼
  background.ts             # 큐 관리, 메시지 라우터
  popup.html / popup.ts     # 플레이어 UI
  lib/speech.ts             # SpeechSynthesis 래퍼
  lib/queue.ts              # 큐 자료구조
manifest.json
tests/
```

## 보안
- Web Speech는 클라이언트만 사용
- Pro 텍스트 전송 시 TLS, 텍스트 비저장(처리 후 30초 캐시만)
- 개인정보처리방침 명시
