# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3
- **Glance** for widgets

## 아키텍처
- MVVM
- Repository + Use Case

## 데이터
- **Room 2.6** - FavoriteStop 엔티티
- **DataStore** - 사용자 설정

## DI
- **Hilt**

## 네트워크
- **Retrofit 2** + Moshi
- OkHttp Interceptor (캐시)
- 공공데이터 API (서울 TOPIS, ODsay)

## 위치
- FusedLocationProviderClient

## 위젯 / 알림
- Glance AppWidget
- WorkManager (주기적 도착 갱신)
- NotificationCompat

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine
- MockWebServer

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
