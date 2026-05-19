# 065 - Error Tracker Lite (Java/Spring) Tech Stack

## 베이스라인

- **Java 17** (LTS, Spring Boot 3.x 베이스라인)
- **Gradle 8.x Kotlin DSL** — 멀티 모듈 빌드
- **Spring Boot 3.3** — 수집 서버, Starter
- **Maven Central** 배포 (Sonatype OSSRH)

## 멀티 모듈 구조

```
errortrack-core              # JDK만 의존, 어떤 환경에서도 동작
errortrack-logback           # core + Logback Appender
errortrack-spring-boot-starter # core + logback + AutoConfiguration
errortrack-server            # 수집 서버 (Spring Boot 3 + Postgres)
errortrack-demo              # 통합 검증용 데모 Spring Boot 앱
```

## SDK 측 (errortrack-*)

| 모듈 | 의존성 | 비고 |
|---|---|---|
| core | JDK 17 표준만 (`java.net.http.HttpClient`) | 외부 라이브러리 0 → Spring 비종속 환경도 사용 가능 |
| logback | core + `ch.qos.logback:logback-classic` | Appender |
| starter | core + logback + `spring-boot-autoconfigure` | `AutoConfiguration` |

### 핵심 설계 원칙

1. **외부 의존성 최소** — core는 JDK 표준만 사용. JSON 직렬화도 수동.
2. **백그라운드 데몬 스레드** — 메인 스레드 차단 없음, JVM 종료 막지 않음.
3. **실패는 무시** — 추적기가 앱을 죽이면 안 됨. 모든 전송 실패는 swallow.
4. **샘플링 / 레이트 리밋** — `errortrack.rate-limit` 옵션으로 폭주 방지.
5. **GraalVM Native Image 호환** — `reflect-config.json` 제공, Spring Boot 3 native 사용자 지원.

## 서버 측 (errortrack-server)

| 영역 | 선택 | 이유 |
|---|---|---|
| 웹 프레임워크 | **Spring Boot 3 + Spring MVC** | 동일 생태계, 운영 친숙도 |
| DB | **Postgres 15** | 단일 DB로 이벤트 + 그룹 모두 저장 |
| ORM | **Spring Data JPA + Hibernate** | 표준 |
| 마이그레이션 | **Flyway** | Java 친화 |
| 큐 | **Postgres `LISTEN/NOTIFY` + advisory lock** | Redis/Kafka 의도적으로 안 씀 (셀프호스팅 단순화) |
| 인증 | **Spring Security + API Key** | 수집은 키, 대시보드는 세션 |
| 대시보드 UI | **Thymeleaf + HTMX + Tailwind** | SPA 없이 가벼움, 단일 jar 배포 |
| 알림 | **Spring `RestClient`** | 슬랙/디스코드/웹훅 |
| 메일 | **Spring Mail (JavaMailSender)** | SMTP |

### 의도적으로 안 쓰는 것

- **Redis / Kafka / BullMQ** — Postgres만으로 충분, 컨테이너 수 줄이는 게 차별점
- **React/Next.js** — Thymeleaf + HTMX로 Java 단일 jar 안에 다 들어감
- **마이크로서비스** — 모놀리스 단일 부트 앱

## 패키징 / 배포

| 산출물 | 도구 |
|---|---|
| SDK (Maven Central) | Gradle `maven-publish` + Sonatype OSSRH + GPG 서명 |
| 서버 컨테이너 | Spring Boot 3 buildpacks (`bootBuildImage`) |
| 셀프호스팅 | `docker-compose.yml` (server + postgres = 2 컨테이너) |
| 클라우드 운영 | 한국 AWS (서울 리전) — RDS Postgres + ECS Fargate |
| 도메인 | `api.errortrack.io` (수집), `app.errortrack.io` (대시보드) |

## 테스트

- **JUnit 5** + **AssertJ**
- **Spring Boot Test** — 수집 서버 통합 테스트
- **Testcontainers (Postgres)** — 실제 Postgres에 대해 통합 테스트
- **WireMock** — SDK 전송 검증

## CI/CD

- **GitHub Actions**
  - PR: `./gradlew check` (단위 + 통합 + 정적 분석)
  - 태그 푸시: Maven Central 자동 배포
  - main 푸시: 서버 컨테이너 빌드 → ECR → ECS 롤아웃

## 정적 분석 / 품질

- **Spotless** (코드 포맷) + Google Java Style
- **ErrorProne** (Google) — null/concurrency 류 잡기
- **JaCoCo** — 커버리지 (목표 80%)

## 결제 / 빌링

- **토스페이먼츠 SDK** — 한국 신용카드, 카카오페이, 네이버페이
- **Stripe** — 글로벌 사용자용 백업

## 관측성

- **Micrometer + Prometheus** — 자기 자신의 메트릭
- **자기 자신을 자기 자신으로 추적** (dogfooding) — 운영 본인 채널이 첫 사용자

## 라이선스

- **Apache 2.0** (전 모듈 동일) — BSL 같은 함정 없이 단순하게
- Cloud 제공이 곧 수익원이라 BSL 불필요
