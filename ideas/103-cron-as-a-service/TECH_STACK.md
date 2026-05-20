# Tech Stack · 103 Cron as a Service

## 런타임
- **Node.js 20** — HTTP 디스패치 워크로드에 적합한 이벤트 루프

## cron 코어
- **자체 구현 파서(의존성 0)** — 5필드 crontab 파싱, 다음 실행 시각 계산. 외부 라이브러리(cron-parser) 대신 직접 구현해 셀프호스팅 신뢰성과 감사 가능성 확보
- UTC 기준 계산으로 타임존 버그 원천 차단, 표시 단계에서만 변환

## 큐/스케줄링
- **BullMQ + Redis** — 지연 잡(delayed job)으로 다음 실행 예약, 재시도/백오프 내장
- 마스터 틱(1분)이 due 잡을 큐에 적재 → 워커가 HTTP 발사

## 데이터
- **PostgreSQL 16** — `jobs`, `runs`(실행 로그), `users` 테이블
- **Prisma** — 마이그레이션 + 타입 안전

## 실행
- **undici fetch** — 타임아웃/리다이렉트 제어된 HTTP 발사
- 응답 본문은 앞 4KB만 저장(로그 비용 통제)

## 알림
- **Resend**(이메일), **Slack webhook**
- 데드맨 스위치: 예상 실행 시각 + 유예 시간 경과 시 경고

## 프론트엔드
- **Next.js 14** + **Tailwind** + **shadcn/ui**
- cron 표현식 입력 시 다음 5회 실행 시각 라이브 미리보기

## 인프라
- **Fly.io Machines** — 워커(다중 리전)
- **Upstash Redis**, **Neon Postgres**

## 테스트
- **Vitest** — 파서/스케줄러를 고정 시각(now 주입)으로 결정론적 테스트

## 선택 이유 요약
정시성과 신뢰성이 제품 가치의 핵심이라 큐는 검증된 BullMQ를 쓰되, cron 해석은 투명성을 위해 직접 구현했다. now()를 주입 가능하게 설계해 시간 의존 로직을 오프라인에서 결정론적으로 테스트한다.
