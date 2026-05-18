# 088 · 1인 위키 / Zettelkasten

## 개요
개인의 지식을 원자(atomic) 단위 노트로 쌓고, `[[wiki-link]]`로 연결해 자기만의 그래프를 만드는 Zettelkasten 도구. 풀텍스트 검색과 백링크가 1급 시민.

## 문제
- Obsidian/Logseq는 강력하나 학습 곡선이 높고 모바일 동기화가 까다로움
- Notion은 데이터베이스 중심이라 노트 간 연결이 약함
- Roam Research는 비싸고 데이터 종속성 우려

## 솔루션
- Markdown + `[[wiki-link]]` 양방향 링크
- SQLite FTS5 (또는 Postgres tsvector)로 즉시 풀텍스트 검색
- 백링크 패널 자동 표시
- 노트가 그래프의 노드 — 그래프 뷰 기본 제공

## 타겟 사용자
- 연구자, 작가, PKM(Personal Knowledge Management) 사용자
- 평생 학습자, 도서 요약가
- 코드/도메인 지식을 체계화하려는 시니어 엔지니어

## 핵심 기능
1. **위키 링크** — `[[note title]]` 자동 인식, 미존재 시 회색 표시 + 클릭으로 생성
2. **백링크** — 현재 노트를 가리키는 모든 노트 자동 노출
3. **풀텍스트 검색** — FTS5 BM25 랭킹, 200ms 이내
4. **태그/속성** — `#tag` 및 YAML 프론트매터
5. **그래프 뷰** — D3 force-directed, 클릭으로 이웃 탐색

## 수익 모델
| 플랜 | 가격 | 노트 수 | 동기화 |
|---|---|---|---|
| Free | $0 | 100 | 로컬 only |
| Pro | $5/월 | 무제한 | 클라우드 + 모바일 |
| Lifetime | $99 | 무제한 | 평생 |

## 경쟁사
- Obsidian, Logseq, Roam Research, Notion, Reflect, Tana

## 차별점
- "노트 하나에 풀텍스트 검색까지 OK"가 5초 안에 데모 가능
- SQLite 단일 파일 export — 데이터 종속 0
- 모바일 PWA 1급, 오프라인 작성/동기화
- API 공개 → CLI/스크립트로 자동 노트 삽입 가능

## KPI
- 가입 → 첫 노트 작성까지 < 2분
- 사용자당 평균 노트 수 7일차 30개 이상
- 검색 사용률 (주간 활성 사용자 중) 80%
- Free → Pro 전환율 6%
- 30일 잔존율 50%

## 마일스톤
- M1 (W1-3): Markdown 에디터 + [[wiki-link]] 파서 + 백링크 패널
- M2 (W4-5): SQLite FTS5 검색 + 그래프 뷰
- M3 (W6-7): Clerk + Stripe + 클라우드 동기화 (last-write-wins)
- M4 (W8-9): 모바일 PWA (오프라인 작성/큐)
- M5 (W10-12): Obsidian import + API 공개

## 리스크와 가정
- 가정: 사용자는 "한 도구로 검색까지" 가능한 단순함을 더 선호한다
- 리스크: Obsidian 사용자는 플러그인 생태계에 종속되어 이전 어려움
- 리스크: 그래프 뷰는 노트 1000개 이상에서 성능 이슈 → 클러스터링 필요
