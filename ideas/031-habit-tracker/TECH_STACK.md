# 기술 스택

## 언어 및 프레임워크
- **Kotlin** 1.9.x
- **Jetpack Compose** (Material 3) - UI
- **Glance 1.0** - 홈 화면 위젯 (Compose 스타일)

## 아키텍처
- MVVM + Clean Architecture
- Single Activity, Compose Navigation
- Unidirectional Data Flow (UDF)

## 데이터 계층
- **Room 2.6** - 로컬 DB (Habit, HabitLog 엔티티)
- **DataStore Preferences** - 사용자 설정, 테마

## 의존성 주입
- **Hilt** - DI 컨테이너

## 비동기
- **Kotlin Coroutines + Flow**
- StateFlow / SharedFlow for ViewModel

## 백그라운드 작업
- **WorkManager** - 일일 리마인더 알림 예약
- **AlarmManager** - 정확한 시각 알림 (옵션)

## 위젯
- **Glance AppWidget** - Compose 스타일 위젯
- BroadcastReceiver로 위젯 탭 처리

## 결제
- **Google Play Billing Library 6.x**

## 광고
- **AdMob** (com.google.android.gms:play-services-ads)

## 테스트
- JUnit4
- MockK
- Turbine (Flow 테스트)
- Compose UI Test

## 빌드
- Gradle 8.x, Kotlin DSL
- minSdk 26, targetSdk 34
- Java 17
