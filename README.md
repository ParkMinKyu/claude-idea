# 140 Monetization Ideas

수익화 가능한 아이디어 140개와 각각의 MVP 구현체 모음입니다.

🌐 **웹사이트**: https://parkminkyu.github.io/claude-idea/ — 검색/필터 가능한 카드 그리드 UI

> 💡 GitHub 저장소 Settings → Pages → "Build and deployment" → Source를 **GitHub Actions**로 설정하면 자동 배포됩니다.

## 구조

각 아이디어는 `ideas/NNN-slug/` 폴더에 다음 파일을 포함합니다:

- `README.md` — 아이디어 상세 문서 (문제, 솔루션, 타겟, 수익 모델)
- `TECH_STACK.md` — 선택된 기술 스택과 그 이유
- `src/` — MVP 구현 코드
- `tests/` — 테스트 코드

## 카테고리 요약

| 코드 | 카테고리 | 개수 | 통과 테스트 |
|------|---------|------|------------|
| AI | AI / LLM 활용 SaaS | 15 | Anthropic SDK + Zod/Pydantic |
| WEB | 웹 SaaS (B2B/B2C) | 15 | 168 tests |
| AND | 안드로이드 모바일 앱 | 15 | Kotlin/Compose/Hilt/Room |
| EXT | 크롬 확장 / 데스크톱 앱 | 10 | 150 tests |
| DEV | 개발자 도구 | 50 | 53+ tests |
| CON | 콘텐츠 / 미디어 | 10 | 137 tests |
| COM | 이커머스 / 마켓플레이스 | 10 | 82 tests |
| PRO | 생산성 도구 | 10 | 79 tests |
| NIC | 니치 / 버티컬 SaaS | 5 | 59 tests |

> 개발자 도구는 056-065(기본 10개) + 101-140(추가 40개) = 총 50개입니다.

---

## 인덱스

### AI / LLM 활용 SaaS (001-015)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 001 | meeting-summarizer | 회의록 자동 요약/액션아이템 추출 | [📁](ideas/001-meeting-summarizer/) · [📖 README](ideas/001-meeting-summarizer/README.md) · [⚙️ Stack](ideas/001-meeting-summarizer/TECH_STACK.md) |
| 002 | ai-resume-tailor | JD 기반 이력서 자동 맞춤화 | [📁](ideas/002-ai-resume-tailor/) · [📖 README](ideas/002-ai-resume-tailor/README.md) · [⚙️ Stack](ideas/002-ai-resume-tailor/TECH_STACK.md) |
| 003 | ai-email-triage | Gmail 우선순위 분류 + 답장 초안 | [📁](ideas/003-ai-email-triage/) · [📖 README](ideas/003-ai-email-triage/README.md) · [⚙️ Stack](ideas/003-ai-email-triage/TECH_STACK.md) |
| 004 | ai-contract-redline | 계약서 위험 조항 하이라이트 | [📁](ideas/004-ai-contract-redline/) · [📖 README](ideas/004-ai-contract-redline/README.md) · [⚙️ Stack](ideas/004-ai-contract-redline/TECH_STACK.md) |
| 005 | ai-cold-outreach | 링크드인 프로필 기반 콜드메일 | [📁](ideas/005-ai-cold-outreach/) · [📖 README](ideas/005-ai-cold-outreach/README.md) · [⚙️ Stack](ideas/005-ai-cold-outreach/TECH_STACK.md) |
| 006 | ai-changelog-writer | Git 커밋 → 릴리스 노트 | [📁](ideas/006-ai-changelog-writer/) · [📖 README](ideas/006-ai-changelog-writer/README.md) · [⚙️ Stack](ideas/006-ai-changelog-writer/TECH_STACK.md) |
| 007 | ai-pr-reviewer | PR 자동 1차 리뷰 봇 | [📁](ideas/007-ai-pr-reviewer/) · [📖 README](ideas/007-ai-pr-reviewer/README.md) · [⚙️ Stack](ideas/007-ai-pr-reviewer/TECH_STACK.md) |
| 008 | ai-doc-qa | 사내 문서 RAG 질의응답 | [📁](ideas/008-ai-doc-qa/) · [📖 README](ideas/008-ai-doc-qa/README.md) · [⚙️ Stack](ideas/008-ai-doc-qa/TECH_STACK.md) |
| 009 | ai-podcast-clipper | 팟캐스트 숏폼 클립 추출 | [📁](ideas/009-ai-podcast-clipper/) · [📖 README](ideas/009-ai-podcast-clipper/README.md) · [⚙️ Stack](ideas/009-ai-podcast-clipper/TECH_STACK.md) |
| 010 | ai-meal-planner | 냉장고 사진 → 레시피 | [📁](ideas/010-ai-meal-planner/) · [📖 README](ideas/010-ai-meal-planner/README.md) · [⚙️ Stack](ideas/010-ai-meal-planner/TECH_STACK.md) |
| 011 | ai-language-tutor | 음성 기반 회화 튜터 | [📁](ideas/011-ai-language-tutor/) · [📖 README](ideas/011-ai-language-tutor/README.md) · [⚙️ Stack](ideas/011-ai-language-tutor/TECH_STACK.md) |
| 012 | ai-interview-coach | 모의 면접 피드백 | [📁](ideas/012-ai-interview-coach/) · [📖 README](ideas/012-ai-interview-coach/README.md) · [⚙️ Stack](ideas/012-ai-interview-coach/TECH_STACK.md) |
| 013 | ai-sql-generator | 자연어 → SQL + 차트 | [📁](ideas/013-ai-sql-generator/) · [📖 README](ideas/013-ai-sql-generator/README.md) · [⚙️ Stack](ideas/013-ai-sql-generator/TECH_STACK.md) |
| 014 | ai-design-critique | UI 스크린샷 → UX 개선안 | [📁](ideas/014-ai-design-critique/) · [📖 README](ideas/014-ai-design-critique/README.md) · [⚙️ Stack](ideas/014-ai-design-critique/TECH_STACK.md) |
| 015 | ai-receipt-extractor | 영수증 OCR → 가계부 | [📁](ideas/015-ai-receipt-extractor/) · [📖 README](ideas/015-ai-receipt-extractor/README.md) · [⚙️ Stack](ideas/015-ai-receipt-extractor/TECH_STACK.md) |

### 웹 SaaS (016-030)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 016 | uptime-monitor | 경량 업타임 모니터링 | [📁](ideas/016-uptime-monitor/) · [📖](ideas/016-uptime-monitor/README.md) · [⚙️](ideas/016-uptime-monitor/TECH_STACK.md) |
| 017 | feedback-widget | 임베드형 사용자 피드백 위젯 | [📁](ideas/017-feedback-widget/) · [📖](ideas/017-feedback-widget/README.md) · [⚙️](ideas/017-feedback-widget/TECH_STACK.md) |
| 018 | changelog-page | 호스팅형 체인지로그 페이지 | [📁](ideas/018-changelog-page/) · [📖](ideas/018-changelog-page/README.md) · [⚙️](ideas/018-changelog-page/TECH_STACK.md) |
| 019 | link-in-bio | 크리에이터용 링크 페이지 | [📁](ideas/019-link-in-bio/) · [📖](ideas/019-link-in-bio/README.md) · [⚙️](ideas/019-link-in-bio/TECH_STACK.md) |
| 020 | form-builder | 노코드 폼 빌더 | [📁](ideas/020-form-builder/) · [📖](ideas/020-form-builder/README.md) · [⚙️](ideas/020-form-builder/TECH_STACK.md) |
| 021 | waitlist-saas | 대기자 명단 + 추천 부스트 | [📁](ideas/021-waitlist-saas/) · [📖](ideas/021-waitlist-saas/README.md) · [⚙️](ideas/021-waitlist-saas/TECH_STACK.md) |
| 022 | status-page | 인시던트/상태 페이지 | [📁](ideas/022-status-page/) · [📖](ideas/022-status-page/README.md) · [⚙️](ideas/022-status-page/TECH_STACK.md) |
| 023 | roadmap-voting | 제품 로드맵 투표 | [📁](ideas/023-roadmap-voting/) · [📖](ideas/023-roadmap-voting/README.md) · [⚙️](ideas/023-roadmap-voting/TECH_STACK.md) |
| 024 | survey-incentive | 토큰 보상 설문 플랫폼 | [📁](ideas/024-survey-incentive/) · [📖](ideas/024-survey-incentive/README.md) · [⚙️](ideas/024-survey-incentive/TECH_STACK.md) |
| 025 | team-standup-bot | 슬랙 스탠드업 자동화 | [📁](ideas/025-team-standup-bot/) · [📖](ideas/025-team-standup-bot/README.md) · [⚙️](ideas/025-team-standup-bot/TECH_STACK.md) |
| 026 | meeting-cost | 회의 비용 실시간 계산기 | [📁](ideas/026-meeting-cost/) · [📖](ideas/026-meeting-cost/README.md) · [⚙️](ideas/026-meeting-cost/TECH_STACK.md) |
| 027 | invoice-generator | 프리랜서 인보이스 SaaS | [📁](ideas/027-invoice-generator/) · [📖](ideas/027-invoice-generator/README.md) · [⚙️](ideas/027-invoice-generator/TECH_STACK.md) |
| 028 | domain-watcher | 도메인 만료/가용 알림 | [📁](ideas/028-domain-watcher/) · [📖](ideas/028-domain-watcher/README.md) · [⚙️](ideas/028-domain-watcher/TECH_STACK.md) |
| 029 | broken-link-checker | 사이트 깨진 링크 점검 | [📁](ideas/029-broken-link-checker/) · [📖](ideas/029-broken-link-checker/README.md) · [⚙️](ideas/029-broken-link-checker/TECH_STACK.md) |
| 030 | pricing-page-ab | 가격 페이지 A/B 테스트 | [📁](ideas/030-pricing-page-ab/) · [📖](ideas/030-pricing-page-ab/README.md) · [⚙️](ideas/030-pricing-page-ab/TECH_STACK.md) |

### 안드로이드 모바일 앱 (031-045)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 031 | habit-tracker | 위젯 중심 습관 트래커 | [📁](ideas/031-habit-tracker/) · [📖](ideas/031-habit-tracker/README.md) · [⚙️](ideas/031-habit-tracker/TECH_STACK.md) |
| 032 | water-reminder | 물 마시기 알림 | [📁](ideas/032-water-reminder/) · [📖](ideas/032-water-reminder/README.md) · [⚙️](ideas/032-water-reminder/TECH_STACK.md) |
| 033 | period-tracker | 생리 주기 추적 | [📁](ideas/033-period-tracker/) · [📖](ideas/033-period-tracker/README.md) · [⚙️](ideas/033-period-tracker/TECH_STACK.md) |
| 034 | budget-tracker | 소비 카테고리 자동 분류 | [📁](ideas/034-budget-tracker/) · [📖](ideas/034-budget-tracker/README.md) · [⚙️](ideas/034-budget-tracker/TECH_STACK.md) |
| 035 | noise-meter | 소음 측정 + 지도 제출 | [📁](ideas/035-noise-meter/) · [📖](ideas/035-noise-meter/README.md) · [⚙️](ideas/035-noise-meter/TECH_STACK.md) |
| 036 | sleep-tracker | 가속도계 수면 단계 측정 | [📁](ideas/036-sleep-tracker/) · [📖](ideas/036-sleep-tracker/README.md) · [⚙️](ideas/036-sleep-tracker/TECH_STACK.md) |
| 037 | receipt-scanner-android | 모바일 영수증 보관/검색 | [📁](ideas/037-receipt-scanner-android/) · [📖](ideas/037-receipt-scanner-android/README.md) · [⚙️](ideas/037-receipt-scanner-android/TECH_STACK.md) |
| 038 | plant-care | 식물 물주기 알림 | [📁](ideas/038-plant-care/) · [📖](ideas/038-plant-care/README.md) · [⚙️](ideas/038-plant-care/TECH_STACK.md) |
| 039 | pomodoro-focus | 차단 기능 포함 포모도로 | [📁](ideas/039-pomodoro-focus/) · [📖](ideas/039-pomodoro-focus/README.md) · [⚙️](ideas/039-pomodoro-focus/TECH_STACK.md) |
| 040 | medication-reminder | 약 복용 알림 + 재고 | [📁](ideas/040-medication-reminder/) · [📖](ideas/040-medication-reminder/README.md) · [⚙️](ideas/040-medication-reminder/TECH_STACK.md) |
| 041 | pet-care | 반려동물 일정/일기 | [📁](ideas/041-pet-care/) · [📖](ideas/041-pet-care/README.md) · [⚙️](ideas/041-pet-care/TECH_STACK.md) |
| 042 | public-transit | 즐겨찾기 정류장 실시간 도착 | [📁](ideas/042-public-transit/) · [📖](ideas/042-public-transit/README.md) · [⚙️](ideas/042-public-transit/TECH_STACK.md) |
| 043 | stretch-coach | 책상 스트레칭 알림 | [📁](ideas/043-stretch-coach/) · [📖](ideas/043-stretch-coach/README.md) · [⚙️](ideas/043-stretch-coach/TECH_STACK.md) |
| 044 | grocery-list | 음성 입력 장보기 리스트 | [📁](ideas/044-grocery-list/) · [📖](ideas/044-grocery-list/README.md) · [⚙️](ideas/044-grocery-list/TECH_STACK.md) |
| 045 | mood-journal | 감정 일기 + 통계 | [📁](ideas/045-mood-journal/) · [📖](ideas/045-mood-journal/README.md) · [⚙️](ideas/045-mood-journal/TECH_STACK.md) |

### 크롬 확장 / 데스크톱 (046-055)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 046 | tab-suspender | 비활성 탭 자동 절전 | [📁](ideas/046-tab-suspender/) · [📖](ideas/046-tab-suspender/README.md) · [⚙️](ideas/046-tab-suspender/TECH_STACK.md) |
| 047 | readlater-tts | 페이지 → 오디오 변환 | [📁](ideas/047-readlater-tts/) · [📖](ideas/047-readlater-tts/README.md) · [⚙️](ideas/047-readlater-tts/TECH_STACK.md) |
| 048 | amazon-pricewatch | 아마존 가격 추적 | [📁](ideas/048-amazon-pricewatch/) · [📖](ideas/048-amazon-pricewatch/README.md) · [⚙️](ideas/048-amazon-pricewatch/TECH_STACK.md) |
| 049 | youtube-summarizer | 유튜브 영상 요약 | [📁](ideas/049-youtube-summarizer/) · [📖](ideas/049-youtube-summarizer/README.md) · [⚙️](ideas/049-youtube-summarizer/TECH_STACK.md) |
| 050 | screenshot-annotator | 스크린샷 + 주석 + 공유 | [📁](ideas/050-screenshot-annotator/) · [📖](ideas/050-screenshot-annotator/README.md) · [⚙️](ideas/050-screenshot-annotator/TECH_STACK.md) |
| 051 | clipboard-history | 클립보드 히스토리 + 검색 | [📁](ideas/051-clipboard-history/) · [📖](ideas/051-clipboard-history/README.md) · [⚙️](ideas/051-clipboard-history/TECH_STACK.md) |
| 052 | pomodoro-tray | 트레이 포모도로 (Electron) | [📁](ideas/052-pomodoro-tray/) · [📖](ideas/052-pomodoro-tray/README.md) · [⚙️](ideas/052-pomodoro-tray/TECH_STACK.md) |
| 053 | window-manager | 윈도우 자동 정렬 핫키 | [📁](ideas/053-window-manager/) · [📖](ideas/053-window-manager/README.md) · [⚙️](ideas/053-window-manager/TECH_STACK.md) |
| 054 | focus-blocker | 사이트 차단 + 일정 | [📁](ideas/054-focus-blocker/) · [📖](ideas/054-focus-blocker/README.md) · [⚙️](ideas/054-focus-blocker/TECH_STACK.md) |
| 055 | color-picker-pro | 디자이너용 컬러피커 | [📁](ideas/055-color-picker-pro/) · [📖](ideas/055-color-picker-pro/README.md) · [⚙️](ideas/055-color-picker-pro/TECH_STACK.md) |

### 개발자 도구 (056-065)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 056 | cron-debugger | cron 표현식 비주얼라이저 | [📁](ideas/056-cron-debugger/) · [📖](ideas/056-cron-debugger/README.md) · [⚙️](ideas/056-cron-debugger/TECH_STACK.md) |
| 057 | regex-playground | Regex 테스트/생성 (AI) | [📁](ideas/057-regex-playground/) · [📖](ideas/057-regex-playground/README.md) · [⚙️](ideas/057-regex-playground/TECH_STACK.md) |
| 058 | api-mocker | 빠른 API 모킹 서비스 | [📁](ideas/058-api-mocker/) · [📖](ideas/058-api-mocker/README.md) · [⚙️](ideas/058-api-mocker/TECH_STACK.md) |
| 059 | json-diff | JSON/YAML diff 뷰어 | [📁](ideas/059-json-diff/) · [📖](ideas/059-json-diff/README.md) · [⚙️](ideas/059-json-diff/TECH_STACK.md) |
| 060 | env-secrets | .env 팀 공유 E2E 암호화 | [📁](ideas/060-env-secrets/) · [📖](ideas/060-env-secrets/README.md) · [⚙️](ideas/060-env-secrets/TECH_STACK.md) |
| 061 | postman-alt | 가벼운 API 클라이언트 | [📁](ideas/061-postman-alt/) · [📖](ideas/061-postman-alt/README.md) · [⚙️](ideas/061-postman-alt/TECH_STACK.md) |
| 062 | cli-installer | 크로스플랫폼 CLI 패키지 매니저 | [📁](ideas/062-cli-installer/) · [📖](ideas/062-cli-installer/README.md) · [⚙️](ideas/062-cli-installer/TECH_STACK.md) |
| 063 | git-stats | 깃 저장소 기여 통계 | [📁](ideas/063-git-stats/) · [📖](ideas/063-git-stats/README.md) · [⚙️](ideas/063-git-stats/TECH_STACK.md) |
| 064 | deploy-preview | PR 프리뷰 자동 배포 | [📁](ideas/064-deploy-preview/) · [📖](ideas/064-deploy-preview/README.md) · [⚙️](ideas/064-deploy-preview/TECH_STACK.md) |
| 065 | error-tracker-lite | Sentry 라이트 버전 | [📁](ideas/065-error-tracker-lite/) · [📖](ideas/065-error-tracker-lite/README.md) · [⚙️](ideas/065-error-tracker-lite/TECH_STACK.md) |

### 콘텐츠 / 미디어 (066-075)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 066 | newsletter-platform | 마이크로 뉴스레터 호스팅 | [📁](ideas/066-newsletter-platform/) · [📖](ideas/066-newsletter-platform/README.md) · [⚙️](ideas/066-newsletter-platform/TECH_STACK.md) |
| 067 | tldr-news | 카테고리별 뉴스 요약 | [📁](ideas/067-tldr-news/) · [📖](ideas/067-tldr-news/README.md) · [⚙️](ideas/067-tldr-news/TECH_STACK.md) |
| 068 | podcast-host | 인디 팟캐스트 호스팅 | [📁](ideas/068-podcast-host/) · [📖](ideas/068-podcast-host/README.md) · [⚙️](ideas/068-podcast-host/TECH_STACK.md) |
| 069 | short-video-cms | 숏폼 비디오 CMS | [📁](ideas/069-short-video-cms/) · [📖](ideas/069-short-video-cms/README.md) · [⚙️](ideas/069-short-video-cms/TECH_STACK.md) |
| 070 | comic-reader | 웹툰 큐레이션 + 구독 | [📁](ideas/070-comic-reader/) · [📖](ideas/070-comic-reader/README.md) · [⚙️](ideas/070-comic-reader/TECH_STACK.md) |
| 071 | aud-book-platform | 인디 작가 오디오북 | [📁](ideas/071-aud-book-platform/) · [📖](ideas/071-aud-book-platform/README.md) · [⚙️](ideas/071-aud-book-platform/TECH_STACK.md) |
| 072 | fanfic-platform | 팬픽션 구독 플랫폼 | [📁](ideas/072-fanfic-platform/) · [📖](ideas/072-fanfic-platform/README.md) · [⚙️](ideas/072-fanfic-platform/TECH_STACK.md) |
| 073 | meme-generator | AI 밈 생성기 + 갤러리 | [📁](ideas/073-meme-generator/) · [📖](ideas/073-meme-generator/README.md) · [⚙️](ideas/073-meme-generator/TECH_STACK.md) |
| 074 | quote-generator | 명언 카드 생성/판매 | [📁](ideas/074-quote-generator/) · [📖](ideas/074-quote-generator/README.md) · [⚙️](ideas/074-quote-generator/TECH_STACK.md) |
| 075 | stock-photo-niche | 한국 스톡 사진 마켓 | [📁](ideas/075-stock-photo-niche/) · [📖](ideas/075-stock-photo-niche/README.md) · [⚙️](ideas/075-stock-photo-niche/TECH_STACK.md) |

### 이커머스 / 마켓플레이스 (076-085)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 076 | print-on-demand | 디자인 → POD 자동 등록 | [📁](ideas/076-print-on-demand/) · [📖](ideas/076-print-on-demand/README.md) · [⚙️](ideas/076-print-on-demand/TECH_STACK.md) |
| 077 | digital-products | 디지털 상품 결제 페이지 | [📁](ideas/077-digital-products/) · [📖](ideas/077-digital-products/README.md) · [⚙️](ideas/077-digital-products/TECH_STACK.md) |
| 078 | secondhand-niche | 카메라 중고 거래 | [📁](ideas/078-secondhand-niche/) · [📖](ideas/078-secondhand-niche/README.md) · [⚙️](ideas/078-secondhand-niche/TECH_STACK.md) |
| 079 | online-classes | 클래스 예약/결제 | [📁](ideas/079-online-classes/) · [📖](ideas/079-online-classes/README.md) · [⚙️](ideas/079-online-classes/TECH_STACK.md) |
| 080 | coupon-aggregator | 쿠폰 어그리게이터 | [📁](ideas/080-coupon-aggregator/) · [📖](ideas/080-coupon-aggregator/README.md) · [⚙️](ideas/080-coupon-aggregator/TECH_STACK.md) |
| 081 | flash-sale | 한정 시간 세일 알림 | [📁](ideas/081-flash-sale/) · [📖](ideas/081-flash-sale/README.md) · [⚙️](ideas/081-flash-sale/TECH_STACK.md) |
| 082 | affiliate-tracker | 어필리에이트 링크 클로커 | [📁](ideas/082-affiliate-tracker/) · [📖](ideas/082-affiliate-tracker/README.md) · [⚙️](ideas/082-affiliate-tracker/TECH_STACK.md) |
| 083 | restaurant-pickup | 픽업 전용 주문 | [📁](ideas/083-restaurant-pickup/) · [📖](ideas/083-restaurant-pickup/README.md) · [⚙️](ideas/083-restaurant-pickup/TECH_STACK.md) |
| 084 | event-tickets | 소규모 이벤트 티켓팅 | [📁](ideas/084-event-tickets/) · [📖](ideas/084-event-tickets/README.md) · [⚙️](ideas/084-event-tickets/TECH_STACK.md) |
| 085 | rent-anything | 일일 대여 마켓플레이스 | [📁](ideas/085-rent-anything/) · [📖](ideas/085-rent-anything/README.md) · [⚙️](ideas/085-rent-anything/TECH_STACK.md) |

### 생산성 도구 (086-095)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 086 | tab-todo | 새 탭 = 할 일 목록 | [📁](ideas/086-tab-todo/) · [📖](ideas/086-tab-todo/README.md) · [⚙️](ideas/086-tab-todo/TECH_STACK.md) |
| 087 | meeting-notes | 회의록 템플릿 SaaS | [📁](ideas/087-meeting-notes/) · [📖](ideas/087-meeting-notes/README.md) · [⚙️](ideas/087-meeting-notes/TECH_STACK.md) |
| 088 | wiki-personal | 1인 위키 / Zettelkasten | [📁](ideas/088-wiki-personal/) · [📖](ideas/088-wiki-personal/README.md) · [⚙️](ideas/088-wiki-personal/TECH_STACK.md) |
| 089 | time-tracker | 자동 시간 추적 | [📁](ideas/089-time-tracker/) · [📖](ideas/089-time-tracker/README.md) · [⚙️](ideas/089-time-tracker/TECH_STACK.md) |
| 090 | calendar-blocker | 딥워크 캘린더 차단 | [📁](ideas/090-calendar-blocker/) · [📖](ideas/090-calendar-blocker/README.md) · [⚙️](ideas/090-calendar-blocker/TECH_STACK.md) |
| 091 | bookmark-manager | 태그/검색 강화 북마크 | [📁](ideas/091-bookmark-manager/) · [📖](ideas/091-bookmark-manager/README.md) · [⚙️](ideas/091-bookmark-manager/TECH_STACK.md) |
| 092 | screenshot-organizer | 스크린샷 OCR + 검색 | [📁](ideas/092-screenshot-organizer/) · [📖](ideas/092-screenshot-organizer/README.md) · [⚙️](ideas/092-screenshot-organizer/TECH_STACK.md) |
| 093 | voice-memo-organizer | 음성 메모 → 텍스트 정리 | [📁](ideas/093-voice-memo-organizer/) · [📖](ideas/093-voice-memo-organizer/README.md) · [⚙️](ideas/093-voice-memo-organizer/TECH_STACK.md) |
| 094 | daily-review | 하루 회고 자동 프롬프트 | [📁](ideas/094-daily-review/) · [📖](ideas/094-daily-review/README.md) · [⚙️](ideas/094-daily-review/TECH_STACK.md) |
| 095 | distraction-stats | 집중 통계 대시보드 | [📁](ideas/095-distraction-stats/) · [📖](ideas/095-distraction-stats/README.md) · [⚙️](ideas/095-distraction-stats/TECH_STACK.md) |

### 니치 / 버티컬 SaaS (096-100)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 096 | saunadispatch-fitness | 헬스장 락커/타올 관리 | [📁](ideas/096-saunadispatch-fitness/) · [📖](ideas/096-saunadispatch-fitness/README.md) · [⚙️](ideas/096-saunadispatch-fitness/TECH_STACK.md) |
| 097 | tattoo-booking | 타투이스트 예약 시스템 | [📁](ideas/097-tattoo-booking/) · [📖](ideas/097-tattoo-booking/README.md) · [⚙️](ideas/097-tattoo-booking/TECH_STACK.md) |
| 098 | airbnb-cleaning | 청소업체 일정 자동화 | [📁](ideas/098-airbnb-cleaning/) · [📖](ideas/098-airbnb-cleaning/README.md) · [⚙️](ideas/098-airbnb-cleaning/TECH_STACK.md) |
| 099 | laundromat-pos | 빨래방 무인 결제/예약 | [📁](ideas/099-laundromat-pos/) · [📖](ideas/099-laundromat-pos/README.md) · [⚙️](ideas/099-laundromat-pos/TECH_STACK.md) |
| 100 | foodtruck-locator | 푸드트럭 위치/메뉴 SaaS | [📁](ideas/100-foodtruck-locator/) · [📖](ideas/100-foodtruck-locator/README.md) · [⚙️](ideas/100-foodtruck-locator/TECH_STACK.md) |

### 개발자 도구 — 추가 (101-140)

| # | 아이디어 | 한 줄 설명 | 링크 |
|---|---------|-----------|------|
| 101 | webhook-tester | 웹훅 수신/검사 도구 | [📁](ideas/101-webhook-tester/) · [📖](ideas/101-webhook-tester/README.md) · [⚙️](ideas/101-webhook-tester/TECH_STACK.md) |
| 102 | jwt-debugger | JWT 디코더/검증 | [📁](ideas/102-jwt-debugger/) · [📖](ideas/102-jwt-debugger/README.md) · [⚙️](ideas/102-jwt-debugger/TECH_STACK.md) |
| 103 | cron-as-a-service | 크론 작업 호스팅 | [📁](ideas/103-cron-as-a-service/) · [📖](ideas/103-cron-as-a-service/README.md) · [⚙️](ideas/103-cron-as-a-service/TECH_STACK.md) |
| 104 | uuid-toolkit | UUID/ULID 생성/검사 | [📁](ideas/104-uuid-toolkit/) · [📖](ideas/104-uuid-toolkit/README.md) · [⚙️](ideas/104-uuid-toolkit/TECH_STACK.md) |
| 105 | base64-toolkit | 인코딩/디코딩 멀티툴 | [📁](ideas/105-base64-toolkit/) · [📖](ideas/105-base64-toolkit/README.md) · [⚙️](ideas/105-base64-toolkit/TECH_STACK.md) |
| 106 | diff-as-service | 텍스트 diff API | [📁](ideas/106-diff-as-service/) · [📖](ideas/106-diff-as-service/README.md) · [⚙️](ideas/106-diff-as-service/TECH_STACK.md) |
| 107 | markdown-preview-api | 마크다운 → HTML 렌더 API | [📁](ideas/107-markdown-preview-api/) · [📖](ideas/107-markdown-preview-api/README.md) · [⚙️](ideas/107-markdown-preview-api/TECH_STACK.md) |
| 108 | openapi-linter | OpenAPI 스펙 검증 | [📁](ideas/108-openapi-linter/) · [📖](ideas/108-openapi-linter/README.md) · [⚙️](ideas/108-openapi-linter/TECH_STACK.md) |
| 109 | graphql-playground | 셀프호스팅 GraphQL IDE | [📁](ideas/109-graphql-playground/) · [📖](ideas/109-graphql-playground/README.md) · [⚙️](ideas/109-graphql-playground/TECH_STACK.md) |
| 110 | db-schema-visualizer | DB 스키마 ERD 생성 | [📁](ideas/110-db-schema-visualizer/) · [📖](ideas/110-db-schema-visualizer/README.md) · [⚙️](ideas/110-db-schema-visualizer/TECH_STACK.md) |
| 111 | sql-formatter | SQL 포매터/린터 | [📁](ideas/111-sql-formatter/) · [📖](ideas/111-sql-formatter/README.md) · [⚙️](ideas/111-sql-formatter/TECH_STACK.md) |
| 112 | log-viewer | 실시간 로그 뷰어/필터 | [📁](ideas/112-log-viewer/) · [📖](ideas/112-log-viewer/README.md) · [⚙️](ideas/112-log-viewer/TECH_STACK.md) |
| 113 | feature-flag-lite | 경량 피처 플래그 | [📁](ideas/113-feature-flag-lite/) · [📖](ideas/113-feature-flag-lite/README.md) · [⚙️](ideas/113-feature-flag-lite/TECH_STACK.md) |
| 114 | ab-test-sdk | A/B 테스트 SDK | [📁](ideas/114-ab-test-sdk/) · [📖](ideas/114-ab-test-sdk/README.md) · [⚙️](ideas/114-ab-test-sdk/TECH_STACK.md) |
| 115 | rate-limiter-service | API 레이트 리밋 | [📁](ideas/115-rate-limiter-service/) · [📖](ideas/115-rate-limiter-service/README.md) · [⚙️](ideas/115-rate-limiter-service/TECH_STACK.md) |
| 116 | status-badge-gen | README 배지 생성기 | [📁](ideas/116-status-badge-gen/) · [📖](ideas/116-status-badge-gen/README.md) · [⚙️](ideas/116-status-badge-gen/TECH_STACK.md) |
| 117 | changelog-from-pr | PR에서 체인지로그 | [📁](ideas/117-changelog-from-pr/) · [📖](ideas/117-changelog-from-pr/README.md) · [⚙️](ideas/117-changelog-from-pr/TECH_STACK.md) |
| 118 | dependency-audit | 의존성 취약점 스캔 | [📁](ideas/118-dependency-audit/) · [📖](ideas/118-dependency-audit/README.md) · [⚙️](ideas/118-dependency-audit/TECH_STACK.md) |
| 119 | license-checker | 라이선스 호환성 검사 | [📁](ideas/119-license-checker/) · [📖](ideas/119-license-checker/README.md) · [⚙️](ideas/119-license-checker/TECH_STACK.md) |
| 120 | dockerfile-linter | Dockerfile 베스트프랙티스 | [📁](ideas/120-dockerfile-linter/) · [📖](ideas/120-dockerfile-linter/README.md) · [⚙️](ideas/120-dockerfile-linter/TECH_STACK.md) |
| 121 | k8s-yaml-validator | K8s 매니페스트 검증 | [📁](ideas/121-k8s-yaml-validator/) · [📖](ideas/121-k8s-yaml-validator/README.md) · [⚙️](ideas/121-k8s-yaml-validator/TECH_STACK.md) |
| 122 | terraform-cost | Terraform 비용 예측 | [📁](ideas/122-terraform-cost/) · [📖](ideas/122-terraform-cost/README.md) · [⚙️](ideas/122-terraform-cost/TECH_STACK.md) |
| 123 | ssl-monitor | SSL 인증서 만료 모니터 | [📁](ideas/123-ssl-monitor/) · [📖](ideas/123-ssl-monitor/README.md) · [⚙️](ideas/123-ssl-monitor/TECH_STACK.md) |
| 124 | dns-propagation | DNS 전파 체커 | [📁](ideas/124-dns-propagation/) · [📖](ideas/124-dns-propagation/README.md) · [⚙️](ideas/124-dns-propagation/TECH_STACK.md) |
| 125 | http-headers-analyzer | 보안 헤더 분석 | [📁](ideas/125-http-headers-analyzer/) · [📖](ideas/125-http-headers-analyzer/README.md) · [⚙️](ideas/125-http-headers-analyzer/TECH_STACK.md) |
| 126 | lighthouse-ci | 성능 측정 CI | [📁](ideas/126-lighthouse-ci/) · [📖](ideas/126-lighthouse-ci/README.md) · [⚙️](ideas/126-lighthouse-ci/TECH_STACK.md) |
| 127 | bundle-analyzer | 번들 사이즈 추적 | [📁](ideas/127-bundle-analyzer/) · [📖](ideas/127-bundle-analyzer/README.md) · [⚙️](ideas/127-bundle-analyzer/TECH_STACK.md) |
| 128 | code-screenshot | 코드 → 이미지 | [📁](ideas/128-code-screenshot/) · [📖](ideas/128-code-screenshot/README.md) · [⚙️](ideas/128-code-screenshot/TECH_STACK.md) |
| 129 | api-changelog | API 변경 추적/알림 | [📁](ideas/129-api-changelog/) · [📖](ideas/129-api-changelog/README.md) · [⚙️](ideas/129-api-changelog/TECH_STACK.md) |
| 130 | mock-data-gen | 가짜 데이터 생성 API | [📁](ideas/130-mock-data-gen/) · [📖](ideas/130-mock-data-gen/README.md) · [⚙️](ideas/130-mock-data-gen/TECH_STACK.md) |
| 131 | color-contrast-checker | 접근성 대비 검사 | [📁](ideas/131-color-contrast-checker/) · [📖](ideas/131-color-contrast-checker/README.md) · [⚙️](ideas/131-color-contrast-checker/TECH_STACK.md) |
| 132 | favicon-generator | 파비콘 멀티사이즈 생성 | [📁](ideas/132-favicon-generator/) · [📖](ideas/132-favicon-generator/README.md) · [⚙️](ideas/132-favicon-generator/TECH_STACK.md) |
| 133 | og-image-gen | OG 이미지 동적 생성 | [📁](ideas/133-og-image-gen/) · [📖](ideas/133-og-image-gen/README.md) · [⚙️](ideas/133-og-image-gen/TECH_STACK.md) |
| 134 | sitemap-generator | 사이트맵 자동 생성 | [📁](ideas/134-sitemap-generator/) · [📖](ideas/134-sitemap-generator/README.md) · [⚙️](ideas/134-sitemap-generator/TECH_STACK.md) |
| 135 | robots-txt-tester | robots.txt 검증 | [📁](ideas/135-robots-txt-tester/) · [📖](ideas/135-robots-txt-tester/README.md) · [⚙️](ideas/135-robots-txt-tester/TECH_STACK.md) |
| 136 | email-template-tester | 이메일 HTML 렌더 테스트 | [📁](ideas/136-email-template-tester/) · [📖](ideas/136-email-template-tester/README.md) · [⚙️](ideas/136-email-template-tester/TECH_STACK.md) |
| 137 | webhook-relay | 로컬 웹훅 터널 | [📁](ideas/137-webhook-relay/) · [📖](ideas/137-webhook-relay/README.md) · [⚙️](ideas/137-webhook-relay/TECH_STACK.md) |
| 138 | secret-scanner | 코드 시크릿 스캔 | [📁](ideas/138-secret-scanner/) · [📖](ideas/138-secret-scanner/README.md) · [⚙️](ideas/138-secret-scanner/TECH_STACK.md) |
| 139 | commit-lint | 커밋 메시지 컨벤션 검사 | [📁](ideas/139-commit-lint/) · [📖](ideas/139-commit-lint/README.md) · [⚙️](ideas/139-commit-lint/TECH_STACK.md) |
| 140 | pr-size-labeler | PR 크기 자동 라벨 | [📁](ideas/140-pr-size-labeler/) · [📖](ideas/140-pr-size-labeler/README.md) · [⚙️](ideas/140-pr-size-labeler/TECH_STACK.md) |

---

## 사용 방법

각 아이디어 폴더로 이동 후:

```bash
cd ideas/001-meeting-summarizer
cat README.md       # 아이디어 상세
cat TECH_STACK.md   # 기술 스택
npm install         # 또는 pip install -r requirements.txt
npm test            # 또는 pytest
```

## 라이선스 / 기여

본 저장소는 시드/스캐폴드 모음입니다. 각 아이디어는 독립적으로 발전시킬 수 있습니다.
