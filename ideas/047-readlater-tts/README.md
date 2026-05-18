# 047 - ReadLater TTS

웹페이지를 오디오로 변환해주는 Chrome Extension. Web Speech API와 Pro 티어에서 클라우드 TTS(ElevenLabs/Azure)를 사용합니다.

## 개요
긴 블로그 글, 뉴스, 문서를 읽기엔 시간이 없지만 출퇴근·운동·설거지 중에 들을 수는 있습니다. ReadLater TTS는 현재 페이지의 본문을 추출하여 즉시 재생하거나 큐에 추가하고, Pro 사용자는 고품질 음성으로 오프라인 다운로드도 가능합니다.

## 문제
- 읽고 싶은 글은 쌓이지만 시간 없음
- Pocket / Instapaper의 TTS는 모바일 전용
- Web Speech 음성은 부자연스럽고 한국어 품질이 낮음
- 본문 외 광고/네비게이션이 함께 읽힘

## 솔루션
- Mozilla Readability로 본문만 추출
- 무료: 브라우저 내장 Web Speech API
- Pro: 서버 프록시 통해 ElevenLabs/Azure Neural TTS 호출, MP3 다운로드
- 큐(read later) 관리, 재생 위치 저장, 속도 조절

## 타겟
- 통근/운동하는 직장인, 학생
- 시각 피로/디스레시아 사용자
- 영어 학습자 (속도 조절, 단어 강조)

## 핵심 기능
- 페이지 본문 추출 → 즉시 재생
- 큐(Read Later)에 추가, 순서 변경
- 재생 속도 0.5x~3x, 음성 선택
- 진행 바, 다음 문장 점프
- Pro: ElevenLabs 자연스러운 음성, MP3 다운로드, 오프라인 큐 동기화
- Pro: 다국어 (한국어/영어/일본어)

## 수익 모델
- Free: Web Speech 음성, 큐 10개, 일 30분 재생
- Pro ($5.99/월):
  - 자연스러운 클라우드 음성 5종
  - MP3 다운로드 (무제한)
  - 큐 무제한 + 기기 동기화
  - 일 5시간 재생량
- Lifetime ($79)

## 경쟁사
- Speechify (서비스형, $139/년)
- Natural Reader
- Pocket TTS

## 차별점
- 브라우저 내장형으로 즉시 사용
- 무료 티어에 광고 없음
- 한국어 자연 음성 (Azure ko-KR Neural)
- 가격이 경쟁사의 1/3

## KPI
- 일 평균 재생 시간 / 사용자
- Pro 전환율 (목표 5%)
- 큐 항목 수 평균
- WAU 리텐션 30일 (목표 35%)
