# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity

## 데이터
- **Room 2.6** - StretchSession, StretchExercise 엔티티
- **DataStore** - 알림 설정
- 운동 데이터: assets JSON

## DI
- **Hilt**

## 미디어
- **ExoPlayer / Media3** - 영상 재생

## 알림 / 백그라운드
- WorkManager (반복 알림)
- AlarmManager
- NotificationCompat

## 캘린더
- CalendarContract API (회의 회피)

## 위젯
- Glance AppWidget

## 헬스 연동
- Health Connect API

## 결제 / 광고
- Google Play Billing 6.x
- AdMob Rewarded

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
