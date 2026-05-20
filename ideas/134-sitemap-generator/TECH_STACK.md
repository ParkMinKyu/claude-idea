# TECH STACK · Sitemap Generator

## 언어/런타임
- Node.js 22 (ESM), 의존성 0
- 표준 `fetch`/`URL`만 사용해 어떤 런타임에서도 동작

## 코어 라이브러리 (`src/sitemap.js`)
- `normalizeUrl`: 해시 제거, 트레일링 슬래시 정리, utm/fbclid/gclid 제거
- `sameHost` / `extractLinks`: 동일 호스트 내부 링크 추출(+nofollow 정책)
- `crawl`: BFS, `fetchImpl` 주입형으로 오프라인 테스트 가능, maxPages 제한
- `buildSitemap`: 표준 XML(loc/lastmod/changefreq/priority) + XML 이스케이프
- `buildSitemapIndex`: 5만 한도 초과 시 자동 분할 + 인덱스

## CLI (`src/cli.js`)
- `node src/cli.js <seed> [maxPages]` → stdout으로 sitemap.xml
- 실제 네트워크는 전역 `fetch` 사용, 테스트는 mock 주입

## 테스트
- `node --test` (의존성 없이 `npm test`)
- 검증 포인트: 정규화, 중복/nofollow, BFS·maxPages, XML 이스케이프, 인덱스 분할

## 서비스화
- 예약 크롤은 큐(BullMQ)+워커, 결과는 객체 스토리지에 게시
- 변경 감지(diff) 후 검색엔진 핑 + 웹훅 알림
- 멀티 도메인 워크스페이스는 Postgres로 관리

## 운영 고려
- robots.txt 존중 옵션, crawl-delay, 동시성 제한
- 대형 사이트는 증분 크롤(이전 결과 캐시 활용)
