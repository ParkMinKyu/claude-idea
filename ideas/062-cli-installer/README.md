# 062 - CLI Installer (크로스플랫폼 CLI 패키지 매니저)

## 개요
GitHub Releases에 올라온 CLI 도구를 OS / 아키텍처 자동 감지로 설치하는 통합 패키지 매니저입니다. Homebrew(macOS), Scoop(Windows), apt/yum(Linux)에 등록되지 않은 도구도 `pix install foo/bar` 한 줄로 설치할 수 있습니다.

## 문제
- 새 CLI 도구마다 OS별 설치법이 다름 (brew / scoop / curl | bash)
- Linux의 경우 배포판마다 패키지 매니저 분산
- `curl | bash` 패턴은 보안상 위험
- 회사 사내 도구는 어떤 공식 매니저에도 등록 불가

## 솔루션
- **자동 감지**: OS, 아키텍처(amd64/arm64) 기반 GitHub Release 자산 선택
- **체크섬 검증**: 자산과 함께 배포된 SHA256SUMS 자동 검증
- **PATH 자동 등록**: `~/.pix/bin` 추가
- **버전 관리**: `pix install foo/bar@1.2.3`, `pix list`, `pix upgrade`
- **사설 레지스트리** (Pro): 사내 GitHub Enterprise / 자체 호스팅
- **잠금 파일**: `pix.lock`으로 팀/CI 재현 가능

## 타겟
- 개발자 (다양한 CLI 도구 사용자)
- 데브옵스 / 플랫폼 엔지니어 (서버 부트스트랩)
- 사내 도구 배포 담당 (회사 내 CLI)
- 부트캠프 / 교육 (환경 셋업 자동화)

## 핵심 기능
1. **GitHub Release 설치**: `pix install owner/repo`
2. **OS / arch 자동 매칭**: 자산 이름 휴리스틱
3. **체크섬 검증**: SHA256SUMS, cosign 서명 (옵션)
4. **버전 핀**: `pix install owner/repo@v1.2.3`
5. **잠금 파일**: 팀/CI 재현
6. **사설 레지스트리** (Pro)
7. **manifest 파일**: 프로젝트당 `.pix.yml`
8. **자동 업데이트 알림**

## 수익 모델
- **오픈코어**: CLI는 MIT 오픈소스
- **Free**: 공개 GitHub 무제한
- **Pro ($10/사용자/월)**: 사설 레지스트리, GHE 통합, SSO
- **Team ($30/사용자/월)**: 감사 로그, 컴플라이언스 정책
- **Enterprise**: 셀프호스팅 레지스트리, SLA

## 경쟁사
- Homebrew (macOS / Linux, 등록 필요)
- Scoop / Chocolatey (Windows)
- Eget (단발 설치, 관리 기능 없음)
- ubi (similar)
- asdf / mise (언어 런타임 위주)

## 차별점
- 진정한 크로스플랫폼 (단일 CLI, 단일 매니페스트)
- 등록 불필요 (GitHub Release만 있으면 즉시 설치 가능)
- 잠금 파일 (CI 재현성)
- 한국어 메시지, 한국 미러 (다운로드 속도)
- 사설 레지스트리 (사내 도구 배포 채널)

## KPI
- CLI 다운로드 수 (월별)
- 평균 `pix install` 호출 수 / 사용자
- 잠금 파일 사용률 (CI 통합 지표)
- 사설 레지스트리 가입 조직 수 (Pro 전환)
- GitHub 스타
- 사용자당 평균 관리 도구 수
