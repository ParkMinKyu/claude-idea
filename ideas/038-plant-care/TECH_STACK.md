# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity

## 데이터
- **Room 2.6** - Plant, CareLog 엔티티
- **DataStore** - 설정
- 식물 종 데이터: 정적 JSON (assets) + 원격 업데이트

## DI
- **Hilt**

## 이미지
- **Coil** - 비동기 이미지
- **CameraX** - 식물 사진 촬영

## 식물 식별
- **ML Kit** Image Labeling (베이스)
- 외부 API (PlantNet, iNaturalist) - 옵션

## 알림
- **WorkManager** - 주기 알림 스케줄링
- **AlarmManager** - 정확한 시각

## 날씨 (옵션)
- OpenWeatherMap API

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
