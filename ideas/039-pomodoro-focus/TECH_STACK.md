# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity, Compose Navigation

## 타이머 / 백그라운드
- **ForegroundService** (집중 세션 유지)
- **CountDownTimer** 또는 Flow 기반 ticker

## 앱 차단
- **AccessibilityService** (화면 위 차단 UI)
- **UsageStatsManager** (현재 앱 감지)

## 데이터
- **Room 2.6** - FocusSession, BlockedApp 엔티티
- **DataStore** - 차단 리스트

## DI
- **Hilt**

## 위젯
- **Glance AppWidget**

## 알림
- NotificationCompat

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
