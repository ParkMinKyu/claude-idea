# 006 - Git 커밋에서 사용자용 릴리스 노트 자동 생성

## 개요
git 저장소에서 두 태그(또는 커밋) 사이의 모든 커밋을 분석해, Claude가 개발자용이 아닌 **사용자용** 릴리스 노트를 자동 생성하는 CLI 도구. "fix: typo in README" 같은 노이즈는 제거하고, 사용자 가치 중심으로 재서술.

## 문제
- 릴리스마다 수동으로 changelog 작성하는데 30분~2시간 소요
- 개발자는 커밋을 개발자 용어로 작성 → 사용자가 이해 못함
- 마케팅/CS는 "이번 릴리스에 뭐 들어갔어?"를 매번 물어봐야 함

## 솔루션
- `npx ai-changelog v1.0.0 v1.1.0` 한 줄 실행
- git log + diff 통계 수집 → Claude가 카테고리별(✨신규/🔧개선/🐛버그수정) 분류
- 내부 리팩토링/문서 변경은 자동 제외 가능
- Markdown 출력 → GitHub Release/Notion/사이트에 바로 게시

## 타겟 사용자
- 오픈소스 메인테이너 (릴리스 자주)
- 인디 개발자 / 1인 SaaS (마케팅 자료 부족)
- 스타트업 엔지니어링 매니저

## 핵심 기능
1. 두 ref(태그/커밋/브랜치) 사이 git log 자동 수집
2. 커밋 분류 + 사용자 가치 중심 재서술
3. 노이즈 필터 (refactor/chore/docs 제외 옵션)
4. Markdown/JSON 출력
5. (Pro/CI) GitHub Action으로 자동 릴리스 PR 생성

## 수익 모델
| 티어 | 가격 | 한도 |
|------|------|------|
| OSS | $0 | 공개 저장소 무제한 |
| Solo | $9/월 | 비공개 5개 저장소 |
| Team | $29/월 | 비공개 무제한, GH Action |
| Enterprise | 협의 | self-hosted, SSO |

## 경쟁사
- conventional-changelog: 룰 기반, 사용자 가치 X
- release-please (Google): 좋지만 Conventional Commits 강제
- git-cliff: 템플릿 기반, AI 없음
- changeloghq: 사람이 작성

## 차별점
- Conventional Commits 같은 규약 불필요 — 자유로운 커밋 메시지도 처리
- 개발자 → 사용자 번역 (예: "useState refactor" → 제외, "add export to PDF" → "PDF 내보내기 지원")
- 한국어/영어 출력 동시 지원
- CLI + GitHub Action 둘 다 제공 (수동/자동 모두)

## 핵심 지표 (KPI)
- 월간 활성 저장소 수
- 릴리스 노트 1회당 평균 커밋 수
- 사용자 편집률 (AI 결과를 그대로 게시한 비율)
- OSS → Solo 전환율
- GitHub Action 설치 수 (바이럴 지표)
- 평균 시간 절약 (자가 보고)
