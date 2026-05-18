# Tech Stack — Focus Blocker

## 플랫폼
- Chrome Extension Manifest V3
- Chromium 기반 브라우저

## 언어 & 빌드
- TypeScript 5 strict
- esbuild
- pnpm

## 차단 메커니즘
- `declarativeNetRequest` (정적 / 동적 rules)
- 동적 rule = 일정에 따라 chrome.alarms로 갱신
- 차단 시 `redirect` → `chrome.runtime.getURL("blocked.html?url=...")`

## 저장
- `chrome.storage.sync` (Pro 동기화)
- `chrome.storage.local` (통계, blob 큼)

## 통계
- 차단 이벤트마다 카운트 +1
- daily aggregate

## UI
- popup: 현재 상태, 빠른 토글
- options: 사이트/일정 편집
- blocked.html: 차단 페이지 (커스텀 메시지)

## 결제
- ExtPay

## 테스트
- Vitest
- 일정 매칭, rule 생성 로직 단위 테스트

## 디렉토리
```
src/
  background.ts
  popup.html / popup.ts
  options.html / options.ts
  blocked.html / blocked.ts
  lib/schedule.ts
  lib/rules.ts
  lib/stats.ts
manifest.json
tests/
```

## 보안 / 프라이버시
- 외부 통신 없음 (라이선스 확인만 예외)
- 차단 통계는 로컬 저장
- 우회 사용 시 사용자에게 한 번 더 확인
