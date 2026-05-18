# 093 · 음성 메모 → 텍스트 정리 (Voice Memo Organizer)

## 개요
모바일/데스크톱에서 녹음한 음성 메모를 Whisper로 전사하고, Claude로 요약·할 일·태그를 추출해 검색 가능한 텍스트 형태로 정리하는 웹앱. 산책·운전 중 떠오른 아이디어를 잃지 않게 한다.

## 문제
- iOS 음성 메모는 검색 불가, 재청취 비효율
- Otter/Rev는 비싸고 한국어 정확도 낮음
- 녹음 후 정리하지 않으면 잊혀짐 (캡처 후 가공이 없음)

## 솔루션
- 업로드 또는 PWA 마이크 녹음 → 자동 전사
- 전사 결과를 Claude가 요약, 할 일 추출, 태그 부여
- 검색 가능한 라이브러리에 저장
- Notion/Obsidian/Todoist로 export

## 타겟 사용자
- 작가, 콘텐츠 크리에이터, 1인 사업자
- 영업·컨설턴트 (외근 중 메모)
- ADHD 성향으로 "쓰기"보다 "말하기"가 편한 사용자

## 핵심 기능
1. **다채널 입력** — PWA 녹음, 파일 업로드, 이메일 첨부 (alias 주소)
2. **Whisper 전사** — 한국어 large-v3 우선, 영어/일본어 자동 감지
3. **Claude 정리** — 요약 / 할 일 / 핵심 주제 / 다음 액션
4. **검색** — 풀텍스트 + 태그 + 날짜
5. **export** — Markdown, Notion API, Todoist API

## 수익 모델
| 플랜 | 가격 | 분량 |
|---|---|---|
| Free | $0 | 월 30분 |
| Pro | $9/월 | 월 600분 + Claude 정리 |
| Studio | $29/월 | 월 3000분 + 화자 분리 |

## 경쟁사
- Otter.ai, Rev, Audiopen, MacWhisper, AudioMemos

## 차별점
- "녹음 + AI 정리"가 한 흐름 (Audiopen 유사하나 한국어 정확도 강점)
- Notion/Obsidian/Todoist 내보내기 1급
- 이메일 alias 입력 — 워크플로 단순화
- Whisper large-v3 + Claude의 조합으로 한국어 정확도 최상위

## KPI
- 가입 → 첫 전사 완료까지 < 3분
- 메모당 평균 정리(요약/할 일 채택) 비율 70%
- Free → Pro 전환율 8%
- 일평균 사용자당 녹음 수 1.5건
- 30일 잔존율 50%

## 마일스톤
- M1 (W1-2): PWA 녹음 + Whisper API 전사 + 라이브러리
- M2 (W3-4): Claude 요약·할 일·태그 추출 + JSON 응답 파서
- M3 (W5-6): Resend Inbound 이메일 입력 + Stripe metered billing
- M4 (W7-8): Notion/Todoist export + 검색
- M5 (W9-10): 화자 분리 (Studio 플랜) + 다국어 모델 자동 감지

## 리스크와 가정
- 가정: 한국어 음성 정리 시장에서 Otter/Audiopen은 정확도 한계
- 리스크: Whisper API 비용 → 분량 기반 과금 필수, 토큰 사용량 모니터링
- 리스크: 개인정보 (목소리/내용) → 사용자 옵션으로 원본 자동 삭제
