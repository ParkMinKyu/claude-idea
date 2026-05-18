# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity, Compose Navigation

## 데이터
- **Room 2.6** - Medication, IntakeLog 엔티티
- **DataStore** - 보호자 설정
- 약품 DB: 정적 JSON + 식약처 API (옵션)

## DI
- **Hilt**

## 알림
- **AlarmManager** (정확한 시각)
- NotificationCompat

## 백그라운드
- **WorkManager** (재고 점검 배치)

## 이미지
- Coil
- CameraX (처방전 사진)

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
