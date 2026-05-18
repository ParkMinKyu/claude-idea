# 기술 스택

## Runtime
- **Node.js 20 + TypeScript**: CLI 배포 표준 (`npx` 한 줄 실행), 크로스 플랫폼
- **commander**: CLI 인자 파싱 (`--from`, `--to`, `--format`)
- **execa**: git 서브프로세스 호출

## LLM
- **Claude (claude-sonnet-4-6)**: 분류 + 재서술 작업은 sonnet으로 충분, 비용 효율
- 대규모 릴리스(커밋 100+)는 batch로 묶어 호출

## 출력
- **Markdown**: 기본
- **JSON**: 다른 도구 연동용
- **GitHub Action**: actions/toolkit으로 워크플로우에서 사용

## 배포
- **npm registry**: `npm publish` 한 번
- **GitHub Marketplace**: Action 등록
- **유료 인증**: API 키 발급 후 환경변수 등록 (private repo는 API 호출 시 사용량 카운트)

## 인증/결제 (Phase 2)
- **결제**: Stripe + 자체 서버 (라이센스 키 발급)
- **OSS는 무제한**: GitHub OAuth로 public repo 확인

## 선택 이유 요약
- CLI는 Node.js가 배포/설치 가장 단순
- TypeScript로 타입 안전성
- Claude sonnet은 가격 대비 분류·요약 품질 우수
- npm + GitHub Action 듀얼 채널로 도달률 극대화
