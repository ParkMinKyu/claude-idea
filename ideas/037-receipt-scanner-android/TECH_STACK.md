# 기술 스택

## 언어 / 프레임워크
- Kotlin 1.9
- Jetpack Compose Material 3

## 아키텍처
- MVVM
- Single Activity, Compose Navigation

## OCR / 카메라
- **ML Kit Text Recognition (Korean)**
- **CameraX**
- 이미지 저장: 내부 저장소

## 데이터
- **Room 2.6** - Receipt 엔티티 + FTS4 인덱스
- **DataStore** - 사용자 설정

## DI
- **Hilt**

## 비동기
- Coroutines + Flow

## 클라우드 (옵션)
- Firebase Storage / Google Drive API

## PDF / Export
- iText 또는 안드로이드 PdfDocument
- CSV: 직접 작성

## 결제 / 광고
- Google Play Billing 6.x
- AdMob

## 테스트
- JUnit4, MockK, Turbine

## 빌드
- Gradle 8 + KSP
- minSdk 26, target 34, JVM 17
