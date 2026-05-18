# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Foreground Service for sleep tracking

## 센서 / 오디오
- **SensorManager**: TYPE_ACCELEROMETER (50Hz)
- **AudioRecord**: 코골이 감지 (저주파 RMS)
- 신호 처리: Moving average, threshold

## 데이터
- **Room 2.6** - SleepSession, MovementEvent 엔티티
- **DataStore** - 알람 설정

## DI
- **Hilt**

## 백그라운드
- ForegroundService (Audio + Sensors)
- WorkManager (스마트 알람 트리거)
- AlarmManager (정확한 시각 알람)

## 헬스 연동
- Health Connect API

## 알림
- NotificationCompat + MediaSession

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
