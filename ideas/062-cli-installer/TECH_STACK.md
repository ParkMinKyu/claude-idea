# 기술 스택 - 062 CLI Installer (pix)

## CLI 코어
- **Node.js 20+** + **TypeScript**
- **Commander.js** - 명령 파싱
- **chalk** - 색상 출력
- **ora** - 스피너
- **tar / unzip** - 자산 압축 해제 (`tar`, `node:zlib`)
- **node:crypto** - SHA256 검증

## 단일 실행파일 배포
- **pkg** 또는 **bun build --compile** - Node 의존성 없이 실행
- 자체 부트스트랩 스크립트 (curl one-liner)
- Homebrew, Scoop tap 동시 배포

## 자산 매칭 휴리스틱
- 자체 매처: `darwin-arm64`, `macos-aarch64`, `linux-x86_64-musl` 등 변형 정규화
- 우선순위: 정확 매치 > glibc > musl

## 백엔드 (Pro: 사설 레지스트리)
- **Next.js 14** API
- **PostgreSQL** - 조직, 도구, 권한
- 자산 프록시: GitHub Enterprise / S3
- 인증: **NextAuth.js** + SSO (SAML, OIDC)

## 결제
- **Stripe** 구독

## 잠금 파일
- 형식: YAML (`pix.lock`)
- 필드: 도구, 버전, SHA256, OS/arch별 URL

## 설치 위치
- macOS / Linux: `~/.pix/bin`, `~/.pix/cache`
- Windows: `%USERPROFILE%\.pix\bin`
- PATH 수정: `~/.zshrc`, `~/.bashrc`, PowerShell profile

## 테스트
- **Vitest** - 매처, 파서, 잠금 파일 직렬화
- **execa** - CLI 통합 테스트
- 가상 파일 시스템 (memfs)

## CI/CD
- **GitHub Actions** - 멀티 OS 매트릭스 (macos / windows / ubuntu)
- 자동 GitHub Release + tap 업데이트

## 모니터링 (옵트인)
- 익명 텔레메트리: 가장 많이 설치된 도구 (마켓플레이스 추천에 활용)
- **Sentry** - 에러
