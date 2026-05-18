# 053 - Window Manager

글로벌 단축키로 활성 윈도우를 화면의 절반/사분면/중앙 등으로 즉시 정렬해주는 Electron 데스크톱 앱 (macOS/Windows/Linux).

## 개요
Magnet/Rectangle처럼 단축키 한 번으로 윈도우를 절반·1/3·1/4 등 미리 정의된 영역으로 스냅합니다. 멀티 모니터, 다양한 종횡비에서도 일관된 레이아웃을 제공해, 작업 효율을 크게 높여줍니다.

## 문제
- macOS 기본 윈도우 관리가 제한적 (그리니다 4년 늦게 도입)
- Windows 11 스냅 레이아웃은 단축키 부족
- 멀티 모니터 사용자는 마우스 이동만으로 피곤
- Rectangle은 macOS 전용, Windows AltSnap은 UX 거침

## 솔루션
- 글로벌 단축키 (Cmd/Ctrl+Alt+←/→/↑/↓ 등)
- 1/2, 1/3, 2/3, 1/4 화면 분할 프리셋
- 모니터 간 이동 (Cmd+Shift+Arrow)
- 커스텀 그리드 (Pro)

## 타겟
- 개발자, 디자이너 (멀티 모니터)
- 파워 유저
- macOS에서 Rectangle 대신 크로스 플랫폼 원하는 사람

## 핵심 기능
- 9가지 기본 레이아웃 (절반, 사분면, 중앙)
- 멀티 모니터 지원
- 단축키 사용자 정의
- 자동 시작
- 마우스 드래그 스냅 (Pro)
- 레이아웃 프리셋 저장 (Pro)

## 수익 모델
- Free: 9가지 기본 레이아웃
- Pro ($12 lifetime):
  - 사용자 정의 그리드
  - 앱별 자동 레이아웃 (Slack은 좌측 1/3 등)
  - 드래그 스냅 + 시각 미리보기
  - iCloud 동기화

## 경쟁사
- Rectangle (macOS 무료, 오픈소스)
- Magnet (macOS, $7.99)
- Microsoft PowerToys FancyZones (Windows 무료)
- AltSnap (Windows)

## 차별점
- 크로스 플랫폼 (macOS + Windows + Linux)
- 단순 가격 (라이프타임)
- 오픈소스 (커뮤니티 신뢰)
- 가벼움 (RAM < 60MB)

## KPI
- 일 평균 단축키 사용 횟수
- 활성 사용자당 모니터 수
- Pro 전환율 (목표 6%)
- 30일 리텐션 (목표 50%)
- 사용자 정의 단축키 활성화 비율
- 가장 자주 쓰는 레이아웃 통계

## 마일스톤
- M1: macOS adapter + 9개 기본 레이아웃
- M2: Windows adapter (node-window-manager)
- M3: Linux adapter (wmctrl)
- M4: 사용자 정의 그리드 + Pro 결제
- M5: 앱별 자동 레이아웃 (Pro)

## 리스크
- macOS Accessibility 권한 거부 → 온보딩 영상
- Wayland 호환성 제한 → X11만 지원 명시
