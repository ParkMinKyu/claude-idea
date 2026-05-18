# Tech Stack — Tab Suspender

## 플랫폼
- Chrome Extension Manifest V3
- 대상: Chromium 기반 브라우저 (Chrome, Edge, Brave, Arc)

## 언어 & 빌드
- TypeScript 5.x (strict mode)
- esbuild — 빠른 번들링, 워치 모드 개발
- pnpm — 패키지 매니저

## 런타임 API
- `chrome.tabs.discard()` — 탭 메모리 해제
- `chrome.tabs.query()` / `onActivated` / `onUpdated` — 활동 추적
- `chrome.storage.local` — 설정 영속화
- `chrome.storage.sync` — Pro 동기화
- `chrome.alarms` — 주기적 검사 (서비스 워커 sleep 대응)
- `chrome.action` — 팝업 / 배지 / 아이콘

## 아키텍처
```
background/service_worker.ts  ─ 알람으로 N분마다 트리거
  ↓ getTabs() → 필터 → discard()
popup/index.html + popup.ts    ─ 빠른 토글, 통계 미리보기
options/index.html + ui.ts     ─ 화이트리스트, Pro 설정
content_script.ts              ─ 폼 입력 감지(이메일/메모 등)
```

## 테스트
- Vitest — 단위 테스트
- jsdom — DOM 환경
- `@types/chrome` 모킹 — chrome API stub

## CI / 배포
- GitHub Actions — `pnpm test && pnpm build` → `dist.zip`
- Chrome Web Store Developer Dashboard 수동 업로드 (자동화는 Pro 이후)

## 결제 (Pro)
- ExtPay 또는 Stripe Customer Portal (외부 결제 사이트 + license key)
- 라이선스 검증: 키 → `chrome.storage.local`에 저장 후 N일마다 서버 확인

## 보안 / 프라이버시
- 외부 네트워크 호출 없음 (라이선스 검증 제외)
- 권한 최소화: `tabs`, `storage`, `alarms`, `<all_urls>`(content script)
- 오픈소스 (라이선스: MIT) — 신뢰 확보

## 디렉토리
```
src/
  background.ts
  popup.html / popup.ts
  options.html / options.ts
  content.ts
  lib/suspend-engine.ts
  lib/storage.ts
manifest.json
tests/
```
