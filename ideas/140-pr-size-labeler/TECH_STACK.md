# TECH STACK · PR Size Labeler

## 언어/런타임
- Node.js 22 (ESM), 의존성 0
- GitHub Actions 런타임이 Node이므로 그대로 액션화 가능

## 코어 라이브러리 (`src/labeler.js`)
- `parseDiff`: unified diff → 파일별 additions/deletions(리네임 처리, +++/--- 제외)
- `aggregate`: 락파일/생성물/벤더 무시 패턴 적용해 effective/ignored 분리
- `decideLabel`: 유효 변경량 → size 버킷(임계 커스터마이즈)
- `labelDiff`: end-to-end, 대형 PR 분할 권고(needsReviewSplit) 포함

## CLI (`src/cli.js`)
- `git diff origin/main...HEAD | node src/cli.js` → stdout에 라벨
- CI에서 라벨 캡처 후 API로 PR에 적용

## 통합
- GitHub Action: PR 이벤트에서 base...head diff 계산 → 라벨 부여/교체
- 기존 size/* 라벨 제거 후 단일 라벨만 유지하도록 멱등 처리
- 분할 권고는 PR 코멘트로 자동 안내

## 테스트
- `node --test` (의존성 없이 `npm test`)
- 검증 포인트: diff 파싱, 리네임, 락파일 제외, 버킷 결정, 대형 PR 플래그

## 확장 로드맵
- 무시/임계 규칙 `.pr-size.yml` 외부화
- 언어/디렉터리별 가중치(테스트 코드 할인 등)
- 리뷰 통계 대시보드(라벨별 머지 시간)
