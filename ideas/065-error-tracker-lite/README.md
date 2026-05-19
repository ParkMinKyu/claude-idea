# 065 - Error Tracker Lite (Java/Spring 전용)

> 한 줄 의존성과 한 줄 설정으로 끝나는 Java/Spring 전용 에러 추적 SaaS.

## 한 마디로
Spring Boot에 의존성 하나, `application.yml`에 API 키 한 줄. 그 뒤로는 알아서 작동합니다. 처리 안 된 예외, `log.error()` 로그, 5xx 응답, JPA/Hibernate 예외까지 자동 수집해서 대시보드 + 슬랙 알림으로 보여줍니다.

```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.errortrack</groupId>
  <artifactId>errortrack-spring-boot-starter</artifactId>
  <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
errortrack:
  api-key: ${ERRORTRACK_KEY}
```

끝. 추가 코드 0줄.

## 문제

- 한국 SI / 금융권 / 스타트업의 Java 백엔드 운영자가 겪는 현실:
  - **Sentry는 비쌈** ($26 → 트래픽 증가 시 수백 달러), 한국 결제 미지원
  - **셀프호스팅 Sentry는 30+ 컨테이너** — 운영 부담이 모니터링 도구가 아니라 또 다른 시스템
  - **Spring 통합이 어설픔** — Logback Appender 따로, Web 필터 따로, MDC 따로 설정
  - **JPA/Hibernate 특유 예외** (`LazyInitializationException`, `OptimisticLockException`)가 의미 있게 그룹화되지 않음
- "에러가 났을 때 슬랙 알림 + 어디서 났는지" 만 필요한데 도구가 너무 복잡함

## 솔루션

**Java/Spring에만 집중**해서 통합 깊이를 최대로 끌어올린 경량 에러 추적기.

- **한 줄 통합**: Spring Boot Starter — 의존성 + `api-key` 만으로 모든 후킹 자동
- **깊은 Spring 통합**: `@ControllerAdvice`, Logback Appender, MDC, `@Async` 예외, `RestTemplate`/`WebClient` 5xx, JPA 예외 패턴 — 전부 자동
- **단순한 셀프호스팅**: 단일 `docker-compose.yml` (수집 서버 + Postgres = 2 컨테이너)
- **한국어 우선**: 한국어 UI, 토스/카카오페이 결제, 한국 시간대
- **퍼포먼스 추적 / 세션 리플레이 일부러 없음** — 가볍고 저렴하게 유지

## 타겟

1. **한국 SI / 금융권 / 스타트업** Java 백엔드 (1순위)
2. Spring Boot 기반 1인 SaaS, 사이드 프로젝트
3. 셀프호스팅 선호 보안 민감 조직 (단일 Docker Compose 강점)
4. 글로벌 Spring 생태계 (Maven Central 동시 배포)

## 핵심 기능

1. **자동 후킹** — 0줄 코드
   - 처리 안 된 예외 (`Thread.UncaughtExceptionHandler`)
   - Spring MVC 5xx 응답 (`HandlerExceptionResolver`)
   - Logback `ERROR` 레벨 로그 (자동 Appender 등록)
   - `@Async` / `CompletableFuture` 내부 예외
2. **MDC 자동 캡처** — `MDC.put("userId", ...)` 가 그대로 이벤트에 첨부
3. **JPA/Hibernate 예외 그룹화** — Java 특유 패턴 인식
4. **이슈 대시보드** — 빈도, 영향 사용자, 첫·최근 발생, 트레이스
5. **알림** — 슬랙, 디스코드, 이메일, 웹훅
6. **릴리스 추적** — `errortrack.release` 프로퍼티로 회귀 감지
7. **ProGuard/R8 매핑 업로드** — (Android 사용 시) 난독화된 스택 디코드
8. **셀프호스팅** — 단일 Docker Compose

## 의도적으로 안 만드는 것

- 퍼포먼스 추적 / 분산 트레이싱 (Datadog 영역)
- 세션 리플레이 (Highlight.io 영역)
- 비-Java SDK (Node/Python/Go 등 — 의도적으로 좁게)
- 자체 SDK 프로토콜의 외부 노출 / 다른 도구 호환

→ "Spring Boot에 한 줄 넣으면 에러가 보인다" 만 잘함.

## 수익 모델

오픈코어 구조.

| 플랜 | 가격 | 이벤트/월 | 보관 | 비고 |
|---|---|---|---|---|
| **Self-Hosted Core** | 무료 (Apache 2.0) | 무제한 | 사용자 디스크 | 단일 Compose, 커뮤니티 지원 |
| **Cloud Free** | ₩0 | 5K | 14일 | 1 프로젝트, 슬랙 알림 |
| **Cloud Solo** | ₩12,000 / 월 | 100K | 30일 | 무제한 프로젝트, 토스 결제 |
| **Cloud Team** | ₩39,000 / 월 (5인) | 1M | 90일 | SSO, 감사 로그 |
| **Enterprise** | 견적 | 무제한 | 1년+ | 셀프호스팅 지원 SLA, 한국 SI 납품 |

## 경쟁사

- **Sentry** — 강력하지만 비싸고 무거움. Java SDK는 다국어 SDK 중 하나라 깊이가 부족.
- **GlitchTip** — 오픈소스 Sentry 호환. 가격 강점은 비슷하나 Java/Spring 특화는 아님.
- **Rollbar / Bugsnag** — 가격 Sentry와 유사. 한국 결제 미지원.
- **Datadog / New Relic** — APM 위주, 에러만 쓰기엔 과함.

## 차별점

| 항목 | Sentry | 우리 |
|---|---|---|
| 통합 라인 수 | 5+ 줄 | **0~1줄** (Spring Boot Starter) |
| Logback `ERROR` 자동 수집 | 별도 설정 | **자동** |
| MDC 자동 전파 | 별도 설정 | **자동** |
| JPA 예외 패턴 인식 | 없음 | **자동 그룹화** |
| 셀프호스팅 컨테이너 수 | 30+ | **2** |
| 한국 결제 | ❌ | **토스/카카오** |
| 가격 (100K 이벤트) | $26+ | **₩12,000** |
| 범용 SDK | 30+ 언어 | **Java만 — 그래서 깊음** |

## KPI

- Cloud Free → Solo 전환율 (목표 8%)
- Maven Central 월 다운로드 수
- 셀프호스팅 Docker pull 수
- Spring Boot 버전 커버리지 (2.7 / 3.x / GraalVM Native)
- 평균 이벤트 처리 지연 (< 500ms p99)
- 그룹화 정확도 (사용자 수동 병합 비율)

## 사용 방법

```bash
cd ideas/065-error-tracker-lite
./gradlew build                 # 멀티 모듈 빌드 (core, logback, starter, server, demo)
./gradlew :errortrack-server:bootRun       # 수집 서버 기동 (포트 8088)
./gradlew :errortrack-demo:bootRun         # 데모 클라이언트 기동 (포트 8080)

# 데모에서 에러 발생
curl http://localhost:8080/boom
curl http://localhost:8080/log-error
```

대시보드: `http://localhost:8088`
