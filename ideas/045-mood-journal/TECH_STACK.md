# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity, Compose Navigation

## 데이터
- **Room 2.6** - MoodEntry, MoodTag 엔티티
- **DataStore** - 사용자 설정
- 로컬 우선, 클라우드는 옵트인

## DI
- **Hilt**

## 보안
- AndroidX Biometric (앱 잠금)
- EncryptedSharedPreferences

## 차트
- **Vico** (Compose 차트 라이브러리)

## PDF
- Android PdfDocument

## 알림
- WorkManager (일일 체크인 알림)

## 결제 / 광고
- Google Play Billing 6.x
- AdMob (멘탈 케어 카테고리 외)

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
