# 076 - 디자인 자동 POD 등록 SaaS

## 개요
크리에이터가 디자인 파일(PNG/SVG) 한 장을 업로드하면, 자동으로 티셔츠/머그/포스터 등 다중 SKU를 Printful(또는 Printify)에 일괄 등록하고, 본인의 Shopify/Etsy 스토어와 동기화해주는 마이크로 SaaS입니다.

## 문제
- 디자이너가 POD에서 수익화하려면 제품마다 mockup 생성, 사이즈/색상 SKU 정의, 메타데이터 입력을 수동 반복해야 함
- 한 디자인을 10개 SKU로 풀면 30분~1시간이 소요됨
- 디자인 100개 × 10 SKU = 사실상 풀타임 노동
- 또한 가격/원가/마진 시뮬레이션이 별도 도구 없이 어려움

## 솔루션
- 디자인 1장 업로드 + "프리셋" 선택 (예: "Apparel Pack" = 티셔츠/후디/탱크 × 5색)
- 서버가 Printful 카탈로그 API로 자동 variant 생성, mockup 생성 요청, 가격 마진 계산
- 등록 결과를 단일 대시보드에서 검수 → "Publish" 시 Printful에 일괄 등록
- (Pro) Shopify/Etsy 자동 연동으로 멀티채널 동시 출시

## 타겟 사용자
- 인디 일러스트레이터, AI 아트 크리에이터, 캘리그래퍼
- Etsy/Redbubble에서 부업 중인 디자이너
- 굿즈 라인을 빠르게 테스트하는 IP 보유자 (웹툰/유튜버)

## 핵심 기능
1. 디자인 업로드 (PNG/SVG, 자동 DPI 검사)
2. 프리셋 기반 다중 SKU 생성 (Apparel / Drinkware / Wall Art)
3. 자동 마진 계산기 (목표 마진 % → 판매가 산정)
4. Printful 카탈로그 동기화 및 mockup 미리보기
5. 일괄 publish + 실패 시 재시도
6. (Pro) Shopify/Etsy 멀티 채널 동시 등록

## 수익 모델
| 티어 | 가격 | 한도 |
|------|------|------|
| Free | $0 | 월 5개 디자인 등록, Printful only |
| Creator | $19/월 | 월 100개, Shopify 연동 1개 |
| Studio | $49/월 | 무제한, 멀티 스토어, A/B 가격 테스트 |
| Agency | $149/월 | 5 시트, 화이트라벨, 우선 지원 |

추가: 거래 수수료 없음 (Printful이 자체 마진), 구독 only.

## 경쟁사
- Printful 자체 대시보드 — 자동화/벌크 기능 약함
- Hello Custom, Customily — 개인화 위주, 디자이너용 워크플로 부재
- Placeit — mockup 생성 only, 실제 등록은 수동
- Printify Pop-up — 단일 채널, 멀티 SKU 자동화 부족

## 차별점
- "한 디자인 → N SKU"를 1클릭으로 처리하는 프리셋 시스템
- 마진 시뮬레이터 내장 (경쟁사는 별도 스프레드시트 필요)
- Etsy + Shopify + Printful을 한 화면에서 동기화
- AI 아트 크리에이터 대상 — Midjourney/DALL-E export 직접 import

## 핵심 지표 (KPI)
- 평균 디자인 → 등록 시간 (목표 2분 이하)
- 디자인당 평균 생성 SKU 수
- Free → Creator 전환율 (목표 8%)
- Creator 월간 retention (목표 80%)
- 등록 실패율 (목표 1% 미만)
- 멀티채널(2+ stores) 사용자 비율
