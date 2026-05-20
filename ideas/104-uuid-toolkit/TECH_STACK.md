# Tech Stack · 104 UUID Toolkit

## 언어/빌드
- **TypeScript 5** — 타입 안전한 공개 API(라이브러리 사용자 경험의 핵심)
- **tsc** — ESM + 타입 선언(`.d.ts`) 동시 생성, NodeNext 모듈 해상도
- 빌드 결과를 `dist/`로 출력, `bin`으로 CLI 노출

## 코어 설계
- **의존성 0** — `node:crypto`의 `randomBytes`만 사용. 번들 크기·공급망 보안 우선
- **RNG 주입** — 모든 생성 함수가 `rng` 파라미터를 받아 결정론적 테스트 가능
- **순수 함수** — 부작용 없는 생성/검증으로 트리셰이킹 친화적

## 표준 준수
- UUID v4/v7: RFC 4122 / 9562 nibble(버전·변형) 정확 구현
- ULID: Crockford base32, 48비트 ms 타임스탬프 + 80비트 랜덤

## 배포
- **npm** — 라이브러리 + CLI(`uuidkit`)
- 듀얼 사용: `import { uuidV7 } from "uuid-toolkit"` 또는 `npx uuidkit gen`

## API 서비스(상용)
- **Hono on Cloudflare Workers** — 엣지에서 저지연 생성 API
- **Upstash Redis** — 사용량 카운팅/레이트 리밋

## 테스트
- **Vitest** — `.js` 확장자 import를 TS 소스로 해상(esbuild) → 빌드 없이 테스트
- `@types/node` — Node 전역(process)·`node:crypto` 타입

## 선택 이유 요약
라이브러리 제품이므로 타입 안전성과 작은 번들이 곧 경쟁력이다. 외부 의존성을 배제하고 RNG를 주입 가능하게 설계해, 사용자가 자신의 코드에서 결정론적으로 테스트할 수 있게 했다.
