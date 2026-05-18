# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity, Compose Navigation

## 데이터
- **Room 2.6** - GroceryItem, GroceryList 엔티티
- **DataStore** - 사용자 설정
- 카테고리 사전: assets JSON

## DI
- **Hilt**

## 음성 입력
- **SpeechRecognizer** (Android 시스템)
- 한국어 STT 인텐트

## 공유
- **Firebase Firestore** (실시간 동기화)
- **Firebase Auth** (가족 그룹)

## 비동기
- Coroutines + Flow

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
