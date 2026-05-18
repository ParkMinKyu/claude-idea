# 기술 스택

## 언어 / 프레임워크
- **Kotlin 1.9**
- **Jetpack Compose** Material 3

## 아키텍처
- MVVM
- Single Activity

## 오디오
- **AudioRecord** (PCM 16bit, 44100Hz)
- dB 계산: 20 * log10(RMS / reference)

## 위치 / 지도
- **FusedLocationProviderClient**
- **Naver Map SDK** 또는 Mapbox

## 데이터
- **Room 2.6** - NoiseSample 엔티티
- **DataStore** - 보정 값 / 사용자 설정

## DI
- **Hilt**

## 네트워크
- **Ktor Client** / OkHttp + Retrofit (제출용 백엔드)

## 비동기
- Coroutines + Flow

## 권한
- RECORD_AUDIO
- ACCESS_FINE_LOCATION
- INTERNET

## 결제 / 광고
- Google Play Billing
- AdMob Rewarded

## 테스트
- JUnit4, MockK, Turbine
- Robolectric

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
