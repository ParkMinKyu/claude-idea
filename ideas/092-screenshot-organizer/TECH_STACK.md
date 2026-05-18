# Tech Stack · 092 Screenshot Organizer

## 데스크톱
- **Electron 30** — 메뉴바 only + 검색 팝업 창
- **chokidar** — 폴더 감시
- **Tesseract.js 5** — 워커풀, kor/eng/jpn traineddata
- **sharp** — 썸네일 + 전처리 (그레이스케일, 대비)

## 검색
- **better-sqlite3** — FTS5 (`screenshots_fts`)
- 인덱스 컬럼: text, app, tags
- BM25 정렬 + 제목/태그 부스트

## UI
- **React + Vite** — 검색 팝업
- **Tailwind**
- 글로벌 단축키: `globalShortcut.register("CommandOrControl+Shift+G")`

## 도메인 로직
- OCR 파이프라인: 큐 + 동시 N개 워커, 실패 시 백오프
- 결과 후처리: 공백 정규화, 라인 길이 < 2 필터링
- 분류: 평균 색상으로 코드 캡처 vs 디자인 추정

## 클라우드 (Pro)
- Backblaze B2 — 이미지 백업 (옵션, 사용자 키)

## 테스트
- **Vitest** — OCR 결과 후처리, 검색 쿼리, 큐
- 통합: 작은 PNG 픽스처로 Tesseract 결과 가짜 모킹

## 빌드
- **electron-builder** — DMG/MSI/AppImage
- 자동 업데이트: GitHub Releases

## 개발
- TypeScript, pnpm, ESLint
