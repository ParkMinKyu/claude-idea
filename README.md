# 100 Monetization Ideas

수익화 가능한 아이디어 100개와 각각의 MVP 구현체 모음입니다.

## 구조

각 아이디어는 `ideas/NNN-slug/` 폴더에 다음 파일을 포함합니다:

- `README.md` — 아이디어 상세 문서 (문제, 솔루션, 타겟, 수익 모델)
- `TECH_STACK.md` — 선택된 기술 스택과 그 이유
- `src/` — MVP 구현 코드
- `tests/` — 테스트 코드

## 카테고리

| 코드 | 카테고리 | 개수 |
|------|---------|------|
| AI | AI / LLM 활용 SaaS | 15 |
| WEB | 웹 SaaS (B2B/B2C) | 15 |
| AND | 안드로이드 모바일 앱 | 15 |
| EXT | 크롬 확장 / 데스크톱 앱 | 10 |
| DEV | 개발자 도구 | 10 |
| CON | 콘텐츠 / 미디어 | 10 |
| COM | 이커머스 / 마켓플레이스 | 10 |
| PRO | 생산성 도구 | 10 |
| NIC | 니치 / 버티컬 SaaS | 5 |

## 100 아이디어 목록

### AI / LLM 활용 SaaS (001-015)

1. **001-meeting-summarizer** — 회의록 자동 요약/액션아이템 추출 SaaS
2. **002-ai-resume-tailor** — JD 기반 이력서 자동 맞춤화
3. **003-ai-email-triage** — Gmail 우선순위 자동 분류 + 답장 초안
4. **004-ai-contract-redline** — 계약서 위험 조항 하이라이트
5. **005-ai-cold-outreach** — 링크드인 프로필 기반 콜드메일 생성
6. **006-ai-changelog-writer** — Git 커밋에서 사용자용 릴리스 노트 자동 생성
7. **007-ai-pr-reviewer** — PR 자동 1차 리뷰 봇
8. **008-ai-doc-qa** — 사내 문서 RAG 질의응답
9. **009-ai-podcast-clipper** — 팟캐스트에서 숏폼 클립 자동 추출
10. **010-ai-meal-planner** — 냉장고 사진 → 레시피 추천
11. **011-ai-language-tutor** — 음성 기반 회화 튜터
12. **012-ai-interview-coach** — 모의 면접 피드백
13. **013-ai-sql-generator** — 자연어 → SQL + 차트
14. **014-ai-design-critique** — UI 스크린샷 → UX 개선안
15. **015-ai-receipt-extractor** — 영수증 OCR → 가계부 자동 입력

### 웹 SaaS (B2B/B2C) (016-030)

16. **016-uptime-monitor** — 경량 업타임 모니터링
17. **017-feedback-widget** — 임베드형 사용자 피드백 위젯
18. **018-changelog-page** — 호스팅형 체인지로그/공지 페이지
19. **019-link-in-bio** — 크리에이터용 링크 페이지
20. **020-form-builder** — 노코드 폼 빌더
21. **021-waitlist-saas** — 대기자 명단 + 추천 부스트
22. **022-status-page** — 인시던트/상태 페이지
23. **023-roadmap-voting** — 제품 로드맵 투표
24. **024-survey-incentive** — 토큰 보상 설문 플랫폼
25. **025-team-standup-bot** — 슬랙 스탠드업 자동화
26. **026-meeting-cost** — 회의 비용 실시간 계산기
27. **027-invoice-generator** — 프리랜서 인보이스 SaaS
28. **028-domain-watcher** — 도메인 만료/가용 알림
29. **029-broken-link-checker** — 사이트 깨진 링크 점검
30. **030-pricing-page-ab** — 가격 페이지 A/B 테스트

### 안드로이드 모바일 앱 (031-045)

31. **031-habit-tracker** — 위젯 중심 습관 트래커
32. **032-water-reminder** — 물 마시기 알림
33. **033-period-tracker** — 생리 주기 추적
34. **034-budget-tracker** — 소비 카테고리 자동 분류
35. **035-noise-meter** — 소음 측정 + 지도 제출
36. **036-sleep-tracker** — 가속도계 수면 단계 측정
37. **037-receipt-scanner-android** — 모바일 영수증 보관/검색
38. **038-plant-care** — 식물 물주기 알림
39. **039-pomodoro-focus** — 차단 기능 포함 포모도로
40. **040-medication-reminder** — 약 복용 알림 + 재고
41. **041-pet-care** — 반려동물 일정/일기
42. **042-public-transit** — 즐겨찾기 정류장 실시간 도착
43. **043-stretch-coach** — 책상 스트레칭 알림
44. **044-grocery-list** — 음성 입력 장보기 리스트
45. **045-mood-journal** — 감정 일기 + 통계

### 크롬 확장 / 데스크톱 앱 (046-055)

46. **046-tab-suspender** — 비활성 탭 자동 절전
47. **047-readlater-tts** — 읽다 만 페이지 → 오디오 변환
48. **048-amazon-pricewatch** — 아마존 가격 추적
49. **049-youtube-summarizer** — 유튜브 영상 요약 확장
50. **050-screenshot-annotator** — 스크린샷 + 주석 + 공유
51. **051-clipboard-history** — 클립보드 히스토리 + 검색
52. **052-pomodoro-tray** — 트레이 포모도로 (Electron)
53. **053-window-manager** — 윈도우 자동 정렬 핫키
54. **054-focus-blocker** — 사이트 차단 + 일정
55. **055-color-picker-pro** — 디자이너용 컬러피커 + 팔레트

### 개발자 도구 (056-065)

56. **056-cron-debugger** — cron 표현식 비주얼라이저
57. **057-regex-playground** — Regex 테스트/생성 with AI
58. **058-api-mocker** — 빠른 API 모킹 서비스
59. **059-json-diff** — JSON/YAML diff 뷰어
60. **060-env-secrets** — .env 팀 공유 (E2E 암호화)
61. **061-postman-alt** — 가벼운 API 클라이언트
62. **062-cli-installer** — 크로스플랫폼 CLI 패키지 매니저
63. **063-git-stats** — 깃 저장소 기여 통계 대시보드
64. **064-deploy-preview** — PR 프리뷰 자동 배포
65. **065-error-tracker-lite** — Sentry 라이트 버전

### 콘텐츠 / 미디어 (066-075)

66. **066-newsletter-platform** — 마이크로 뉴스레터 호스팅
67. **067-tldr-news** — 카테고리별 뉴스 요약 뉴스레터
68. **068-podcast-host** — 인디 팟캐스트 호스팅
69. **069-short-video-cms** — 숏폼 비디오 CMS
70. **070-comic-reader** — 웹툰 큐레이션 + 구독
71. **071-aud-book-platform** — 인디 작가 오디오북
72. **072-fanfic-platform** — 팬픽션 구독 플랫폼
73. **073-meme-generator** — AI 밈 생성기 + 갤러리
74. **074-quote-generator** — 명언 카드 생성/판매
75. **075-stock-photo-niche** — 한국 스톡 사진 마켓

### 이커머스 / 마켓플레이스 (076-085)

76. **076-print-on-demand** — 디자인 → POD 자동 등록
77. **077-digital-products** — 디지털 상품 결제 페이지
78. **078-secondhand-niche** — 카메라 중고 거래
79. **079-online-classes** — 클래스 예약/결제
80. **080-coupon-aggregator** — 쿠폰 어그리게이터
81. **081-flash-sale** — 한정 시간 세일 알림
82. **082-affiliate-tracker** — 어필리에이트 링크 클로커
83. **083-restaurant-pickup** — 픽업 전용 주문
84. **084-event-tickets** — 소규모 이벤트 티켓팅
85. **085-rent-anything** — 일일 대여 마켓플레이스

### 생산성 도구 (086-095)

86. **086-tab-todo** — 새 탭 = 할 일 목록
87. **087-meeting-notes** — 회의록 템플릿 SaaS
88. **088-wiki-personal** — 1인 위키 / Zettelkasten
89. **089-time-tracker** — 자동 시간 추적
90. **090-calendar-blocker** — 딥워크 캘린더 차단
91. **091-bookmark-manager** — 태그/검색 강화 북마크
92. **092-screenshot-organizer** — 스크린샷 OCR + 검색
93. **093-voice-memo-organizer** — 음성 메모 → 텍스트 정리
94. **094-daily-review** — 하루 회고 자동 프롬프트
95. **095-distraction-stats** — 집중 통계 대시보드

### 니치 / 버티컬 SaaS (096-100)

96. **096-saunadispatch-fitness** — 헬스장 락커/타올 관리
97. **097-tattoo-booking** — 타투이스트 예약 시스템
98. **098-airbnb-cleaning** — 청소업체 일정 자동화
99. **099-laundromat-pos** — 빨래방 무인 결제/예약
100. **100-foodtruck-locator** — 푸드트럭 위치/메뉴 SaaS

## 진행 상황

각 폴더의 README를 참조하세요. 본 저장소는 시드 단계이며, 점진적으로 MVP 코드가 채워집니다.
