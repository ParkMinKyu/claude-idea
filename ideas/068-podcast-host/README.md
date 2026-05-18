# 068 · 인디 팟캐스트 호스팅

## 개요
인디 팟캐스터를 위한 합리적 가격의 호스팅 SaaS. MP3 업로드 → 트랜스코딩 → RSS 피드 자동 생성 → Apple Podcasts/Spotify 자동 분배까지 한 번에 처리한다.

## 문제
- Buzzsprout, Transistor 등 글로벌 호스팅은 월 $19~로 시작이며 한국 결제·세금계산서 처리가 불편하다.
- Anchor(Spotify for Podcasters)는 무료지만 광고가 강제 삽입되고 RSS 소유권이 불명확하다.
- 자체 S3 + RSS 생성은 사양 준수(itunes:summary, enclosure length 등)가 까다롭다.
- 다운로드 통계가 IAB Tech Lab 2.1 규격(중복 제거 + bot filter)에 부합하지 않으면 광고 영업이 어렵다.

## 솔루션
- MP3/M4A 업로드 → ffmpeg로 트랜스코딩 → S3 저장 → 즉시 RSS 반영
- IAB 2.1 기준 다운로드 집계 (User-Agent 봇 필터 + 동일 IP/24h dedupe)
- iTunes/Spotify가 요구하는 RSS 태그 자동 생성 (`itunes:image`, `itunes:owner`, `enclosure`)
- 에피소드별 챕터, 트랜스크립트 업로드 → 검색 가능한 공개 페이지

## 타겟 사용자
- 한국 인디 팟캐스터, 1인 미디어 운영자
- 사내 팟캐스트를 운영하려는 중소기업
- 팟캐스트 광고 영업이 필요한 채널 (광고주에 IAB 다운로드 리포트 제출)

## 핵심 기능
1. **업로드 & 트랜스코딩** — pre-signed S3 URL로 직접 업로드, 백그라운드 ffmpeg
2. **RSS 피드 생성** — 채널 메타 + 에피소드 enclosure 자동 생성, 캐싱
3. **다운로드 통계** — IAB 2.1 필터 (Range 요청 dedupe, bot UA 제외)
4. **공개 에피소드 페이지** — 임베드 플레이어 + 트랜스크립트 + SEO
5. **광고 슬롯 인서트** — 인트로/아웃트로 동적 ad insertion (Pro 플랜)

## 수익 모델
| 플랜 | 가격 | 저장 용량 | 다운로드 |
|---|---|---|---|
| Hobby | 무료 | 1시간/월 업로드 | 월 1만 다운로드 |
| Indie | $9/월 | 10시간 누적 | 월 10만 |
| Pro | $29/월 | 무제한 | 월 100만 + 광고 인서트 |
| 커스텀 | 협의 | 무제한 | 무제한 + 사설 RSS |

## 경쟁사
- Buzzsprout, Transistor, Captivate, Anchor(Spotify), Podbbang(국내)

## 차별점
- 한국어 트랜스크립트 자동 생성 (Whisper) 기본 포함, Pro에서 화자 분리
- 사업자 등록·세금계산서 발행 (Podbbang 대비 글로벌 분배 강점)
- 광고 인서트 동적 (다운로드 시점에 결정 → 광고 캠페인 교체 용이)
- RSS export = ZIP (이전 자유 보장)

## KPI
- 첫 에피소드 발행까지 평균 < 15분
- Hobby → Indie 전환율 8%
- 월간 신규 에피소드 발행률 70% (활성 채널 기준)
- RSS feed cache hit 95% 이상
- ARR per active podcaster $180 이상
