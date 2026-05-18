# 기술 스택

## 언어 / 프레임워크
- **Kotlin 1.9**
- **Jetpack Compose** Material 3

## 아키텍처
- MVVM, Single Activity
- StateFlow 기반 UDF
- Use Case 분리 (Clean Architecture lite)

## 데이터
- **Room 2.6** - WaterIntake 엔티티
- **DataStore Preferences** - 사용자 프로필(체중, 목표량)

## DI
- **Hilt** 2.50

## 비동기
- Kotlin Coroutines + Flow

## 알림 / 백그라운드
- **WorkManager** - 적응형 알림 스케줄링
- **NotificationManager** - 알림 채널
- **AlarmManager** (Doze 회피)

## 헬스 연동
- **Health Connect API** - Samsung Health / Google Fit

## 위젯
- **Glance** AppWidget

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4 + MockK
- kotlinx-coroutines-test
- Turbine

## 빌드
- Gradle 8, KSP
- minSdk 26, targetSdk 34
- JVM 17
