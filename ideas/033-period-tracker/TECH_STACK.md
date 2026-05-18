# 기술 스택

## 언어 / 프레임워크
- **Kotlin 1.9**
- **Jetpack Compose** Material 3

## 아키텍처
- MVVM, Single Activity
- Repository + Use Case
- Compose Navigation

## 데이터
- **Room 2.6** - CycleEntry, SymptomLog 엔티티
- **SQLCipher** (선택) - DB 암호화
- **DataStore** - 설정, 평균 주기

## DI
- **Hilt 2.50**

## 보안
- **AndroidX Biometric** - 지문/얼굴 잠금
- **EncryptedSharedPreferences**

## 비동기
- Coroutines + Flow, StateFlow

## 예측
- **TensorFlow Lite** (옵션, on-device)
- 통계 기반 베이지안 폴백 (Kotlin)

## 알림
- WorkManager
- NotificationCompat

## 결제
- Google Play Billing 6.x

## 테스트
- JUnit4, MockK, Turbine
- Robolectric (DB 통합 테스트)

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
