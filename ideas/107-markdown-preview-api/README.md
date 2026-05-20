# 107 · 마크다운 → HTML 렌더 API

## 개요
마크다운을 XSS-안전한 HTML로 렌더링하고 목차(TOC)·요약문까지 추출하는 HTTP API. 사용자 생성 마크다운을 안전하게 표시해야 하는 모든 제품을 위한 렌더링 서비스. 직접 sanitize 로직을 운영하기 부담스러운 팀을 타겟한다.

## 문제
- 사용자 입력 마크다운을 렌더링할 때 XSS(script, javascript: URL, onerror 등) 방어를 직접 구현하면 취약점이 생기기 쉽다.
- 마크다운 파서 + sanitizer 조합을 매 서비스마다 설정·유지보수하는 비용이 크다.
- TOC 생성, 요약문 추출 같은 부가 기능을 일관되게 제공하기 어렵다.

## 솔루션
- marked로 GFM 마크다운을 파싱하고 sanitize-html로 위험 태그/속성/스킴을 제거한다.
- 허용 태그/속성/URL 스킴 화이트리스트로 XSS를 차단한다(default-deny).
- 목차(레벨/슬러그)와 SEO용 요약문을 같은 호출로 추출한다.
- 순수 함수 코어라 서버/엣지/라이브러리에서 동일하게 동작한다.

## 타겟 사용자
- 사용자 생성 콘텐츠(코멘트, 위키, 문서)를 표시하는 SaaS
- 마크다운 기반 CMS/블로그 플랫폼
- sanitize 보안을 외주화하려는 보안 민감 팀

## 핵심 기능
1. **안전 렌더러** — marked 파싱 + sanitize-html 화이트리스트로 XSS-safe HTML
2. **URL 스킴 차단** — http/https/mailto만 허용, javascript:/위험 data: 거부
3. **이벤트 핸들러 제거** — onerror/onclick 등 모든 인라인 핸들러 제거
4. **TOC 추출** — 헤딩 레벨 + 한글 호환 슬러그
5. **요약문 추출** — 마크다운 제거 후 plain-text excerpt(SEO/미리보기)

## 수익 모델
오픈코어: 렌더러 코어 라이브러리는 MIT, 호스팅 API·테마·캐시는 SaaS.

| 플랜 | 가격 | 호출/월 | 부가 | 캐시 |
|---|---|---|---|---|
| OSS | $0 | self-host | TOC/excerpt | - |
| Free | $0 | 10k | TOC/excerpt | - |
| Pro | $19/월 | 1M | + 문법 강조 + 테마 | CDN 캐시 |
| Business | $79/월 | 20M | + 커스텀 화이트리스트 | + SLA |

## 사용 시나리오
1. SaaS가 사용자 코멘트(마크다운)를 표시하기 전에 Render API를 호출한다.
2. `POST /render`로 마크다운과 toc 옵션을 보낸다.
3. 응답으로 XSS-safe HTML, 목차, 요약문을 한 번에 받는다.
4. script/javascript:/onerror가 포함돼도 안전하게 제거된 HTML을 받는다.
5. 문서 페이지는 toc로 사이드 내비를, excerpt로 SEO 메타를 채운다.

## 경쟁사
- **marked + DOMPurify 직접 조합** — 유지보수·보안 책임이 자신에게 있음
- **GitHub Markdown API** — 레이트 리밋·GitHub 종속, sanitize 커스텀 불가
- **markdown-it** — 파서만 제공, sanitize/TOC/excerpt 별도 구성
- **렌더 SaaS 일반** — TOC/요약/한글 슬러그 통합 제공은 드묾

## 차별점
- XSS 방어를 화이트리스트 default-deny로 설계 + 테스트로 보장(보안 셀링 포인트)
- 한글 슬러그를 지원하는 TOC(영어 전용 도구 대비 우위)
- 렌더 + TOC + 요약문을 단일 호출로 제공
- 순수 함수 코어로 엣지 배포 가능(저지연)

## KPI
- API 호출량 및 P95 응답 시간(< 30ms)
- XSS 회귀 0건(보안 테스트 통과율 100%)
- Free → Pro 전환율 4% 이상
- OSS Star → API 가입 전환율
- 렌더 실패율 < 0.01%

## 로드맵
- v0: 안전 렌더러 + TOC + 요약문 + HTTP API(현재 MVP)
- v1: 코드 문법 강조(shiki), 테마, 콘텐츠 해시 캐시
- v2: 커스텀 화이트리스트, 수식(KaTeX)/다이어그램(Mermaid)
- v3: 엣지 배포, 팀 정책 관리, SLA
