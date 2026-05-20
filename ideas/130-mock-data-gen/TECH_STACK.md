# TECH STACK · 130 가짜 데이터 생성 API

## 언어 / 런타임
- **Node.js 20+** (ESM) — 라이브러리/CLI/API 동일 코어
- 외부 의존성 0 (자체 시드 RNG + 데이터 풀)

## 코어 아키텍처
- `src/rng.js` — 결정적 의사난수 생성기 (mulberry32 등 32비트 PRNG)
- `src/generators.js` — 타입별 생성기 = `(rng, opts) => value` 순수 함수
- `src/schema.js` — 스키마 객체를 받아 레코드/배치를 생성 (중첩/배열 지원)
- `src/server.js` — 간이 HTTP API (POST /generate)
- `src/cli.js` — 스키마 파일 + count + seed 입력 → JSON 출력

## 시드 RNG
- mulberry32: 32비트 정수 시드 → [0,1) 부동소수
- 동일 (시드, 스키마, count) → 완전히 동일한 출력 보장 (테스트 핵심)

## 타입 (MVP)
- string/lorem, name, email, uuid, int(min,max), float, bool, date(범위), enum(values)
- object(중첩 스키마), array(of 스키마, count)

## 스키마 DSL 예
```json
{ "id": "uuid", "name": "name", "age": { "type": "int", "min": 18, "max": 99 },
  "tags": { "type": "array", "of": "lorem", "count": 3 } }
```

## 테스트
- **vitest** — 동일 시드 재현성, 타입별 출력 형태, 배치 길이, 중첩 스키마를 네트워크 없이 검증

## 배포 / 인프라 (프로덕션 계획)
- API: Cloudflare Workers / Vercel Edge
- 사용량 측정: API 게이트웨이 + Redis
- 라이브러리: npm 배포

## 확장 계획
- 한국어/다국어 로케일 데이터 풀
- 관계(외래키) 및 참조 무결성
- CSV/SQL/Parquet 출력
