# 055 - Color Picker Pro

디자이너용 컬러 픽커 + 팔레트 관리 도구. Chrome Extension(웹 컬러 추출) + Electron(데스크톱 어디서나 픽업) 듀얼 패키지.

## 개요
웹페이지·디자인 파일·로컬 화면 어디서든 컬러를 추출하고, 팔레트로 묶고, CSS/Tailwind/Hex/HSL/RGB/Figma Variables 형식으로 한 번에 export 합니다. Chrome 확장은 페이지 안 요소를 픽업하고, Electron 앱은 전체 화면 어디서나 픽업 + 팔레트 동기화를 담당합니다.

## 문제
- 디자이너는 여러 도구(스크린샷 + 컬러 픽커 + 노트)를 오감
- 브라우저 기본 EyeDropper API는 단순 픽업만, 팔레트 관리 없음
- Sip, ColorSlurp 같은 도구는 macOS 전용, 비쌈
- 팔레트를 팀과 공유하기 어려움

## 솔루션
- Chrome Extension: 페이지 컬러 추출(EyeDropper API + 페이지 내 hover hex 표시)
- Electron: 글로벌 단축키로 전체 화면 어디서나 픽업 (macOS/Win/Linux)
- 두 앱 공통 백엔드에 팔레트 동기화 (Pro)
- export: CSS variables, Tailwind config, JSON, Figma tokens

## 타겟
- 웹/UI 디자이너
- 프론트엔드 개발자
- 디자인 시스템 운영자

## 핵심 기능
- 단일 컬러 픽업 (Hex/RGB/HSL/HSV/OKLCH)
- 팔레트 (드래그 순서, 라벨, 카테고리)
- 자동 대비비(WCAG AA/AAA) 계산
- 색 변환 (Lighten/Darken/Mix/Tint)
- export: CSS/Tailwind/Figma/JSON
- 화면 영역 평균색 추출 (Pro)
- 팔레트 공유 링크 (Pro)

## 수익 모델
- Free: 팔레트 3개, 색당 50개
- Pro ($19 lifetime):
  - 무제한 팔레트
  - 동기화 + 공유
  - Tailwind/Figma 정식 export
  - 평균색 추출

## 경쟁사
- Sip ($14.99, macOS)
- ColorSlurp (freemium, macOS)
- ColorZilla (Chrome 무료, 기본적)
- Adobe Color (웹, 무료)

## 차별점
- 크로스 플랫폼 (Chrome + Desktop)
- WCAG 대비 통합
- 가격 단순 (라이프타임)
- 오픈 export 포맷

## KPI
- 일 평균 픽업 횟수
- 팔레트 수 / 사용자
- Chrome ↔ Electron 동시 사용 비율
- Pro 전환율 (목표 7%)
- export 사용률 (CSS/Tailwind/Figma 비율)
- WCAG AAA 적중 비율

## 마일스톤
- M1: Chrome EyeDropper + 팔레트 기본
- M2: Electron 트레이 + 글로벌 단축키
- M3: WCAG 대비 표시 + 색 변환 도구
- M4: Pro 결제 + 동기화 백엔드
- M5: Figma Variables export + 팀 공유

## 리스크
- macOS screen recording 권한 → 명확한 온보딩
- Electron 앱 번들 크기 → 코드 스플리팅 및 minify
