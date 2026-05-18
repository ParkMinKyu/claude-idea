# 기술 스택

## 언어 / 프레임워크
- **Kotlin 1.9**
- **Jetpack Compose** Material 3

## 아키텍처
- MVVM + Clean Architecture
- StateFlow 기반 UDF
- Compose Navigation

## 데이터
- **Room 2.6** - Transaction, Category, Budget 엔티티
- **DataStore** - 사용자 설정, 예산

## DI
- **Hilt**

## 권한 / SMS
- READ_SMS, RECEIVE_SMS
- BroadcastReceiver로 신규 SMS 수신
- 정규식 + 패턴 매칭으로 카드사 파싱

## ML
- **TensorFlow Lite** - 가맹점 분류 모델
- 폴백: Rule-based 매핑 (Kotlin)

## 비동기
- Coroutines + Flow

## 백그라운드
- WorkManager (배치 분류 작업)

## 결제
- Google Play Billing 6.x

## 광고
- AdMob

## 테스트
- JUnit4, MockK, Turbine
- Robolectric (SMS Parser 테스트)

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
