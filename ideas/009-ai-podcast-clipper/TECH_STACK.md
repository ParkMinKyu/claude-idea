# 기술 스택

## Backend
- **Python 3.11 + FastAPI**: ML/오디오 처리 생태계 (Whisper, librosa) 풍부
- **Celery + Redis**: 영상 처리는 분 단위 → 비동기 작업 큐 필요

## 전사 (STT)
- **faster-whisper (CTranslate2)**: OpenAI Whisper의 4x 빠른 구현
- **모델**: large-v3 (한국어 품질) / small (속도 우선 옵션)
- 단어별 timestamp 활성화

## LLM
- **Claude (claude-opus-4-7)**: 전사문 분석 → 바이럴 구간 식별
- 입력: 단어 timestamp 포함 전사문, 출력: JSON (start/end/hook)

## 영상 처리
- **ffmpeg**: 클리핑 + 자막 burn-in + aspect ratio 변환 (9:16)
- **ffmpeg-python**: Python 바인딩

## Storage
- **S3 호환** (Cloudflare R2): 입력/출력 미디어 저장
- **Postgres**: 작업/사용자/사용량

## 배포
- **GPU 인스턴스**: Whisper용 (RunPod, Lambda Labs)
- **FastAPI는 CPU 인스턴스**: 작업 디스패치만
- **워커 풀**: Celery + GPU 워커

## 선택 이유 요약
- Whisper는 한국어 STT 사실상 표준
- faster-whisper로 비용 1/4
- Claude는 긴 전사문(2시간 분량 수만 단어) 처리 가능
- ffmpeg는 영상 처리 표준
