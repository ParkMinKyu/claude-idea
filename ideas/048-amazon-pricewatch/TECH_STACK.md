# Tech Stack — Amazon PriceWatch

## 플랫폼
- Chrome Extension MV3

## 언어 & 빌드
- TypeScript 5 strict
- esbuild
- pnpm

## API & 데이터
- `chrome.alarms` (서비스 워커 지속성)
- `fetch(url)` — 아마존 상품 페이지 HTML 가져와서 가격 파싱
- Parse: DOMParser + selector ("#priceblock_ourprice", ".a-price .a-offscreen")
- 다국가 selector 매핑 (com/co.jp/de/co.uk)

## 저장
- `chrome.storage.local` — 추적 목록 + 히스토리 (rolling 90일)
- IndexedDB (Pro: 365일 이상)

## 알림
- `chrome.notifications.create`
- 배지 텍스트 (action.setBadgeText)
- 이메일 (Pro): 백엔드 Worker가 SendGrid

## 차트
- 순수 SVG 렌더링 (외부 라이브러리 무사용)

## 결제
- ExtPay or Stripe Customer Portal

## 테스트
- Vitest
- HTML 픽스처 (`tests/fixtures/amazon_*.html`)
- 가격 파서 함수 단위 테스트

## 디렉토리
```
src/
  background.ts
  content.ts          # "Track" 버튼 주입
  popup.html/.ts      # 목록
  detail.html/.ts     # 차트
  lib/parse-price.ts
  lib/store.ts
  lib/chart.ts
manifest.json
tests/
  fixtures/
```

## 컴플라이언스
- 아마존 robots.txt 준수, 호출 빈도 제한 (≥1시간)
- 가격 데이터 저장은 사용자 로컬만
- 아피리에이트 ID(옵션) 첨부, 사용자 동의
