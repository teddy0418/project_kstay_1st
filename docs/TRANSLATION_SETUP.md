# 숙소 설명 자동 번역 (Google Cloud Translation)

게스트가 일본어/중국어로 보는 경우, 호스트가 작성한 숙소 설명을 자동 번역해 표시합니다.
번역 결과는 DB에 캐시되어 재호출 시 API 비용이 발생하지 않습니다.

## 설정

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 (또는 생성)
3. **APIs & Services** → **Library** → "Cloud Translation API" 검색 → **활성화**
4. **APIs & Services** → **Credentials** → **Create credentials** → **API key**
5. 생성된 API 키 복사

### 2. 환경 변수

`.env.local`에 추가:

```
GOOGLE_TRANSLATE_API_KEY=복사한_API_키
```

### 3. API 키 제한 (선택, 권장)

- API 키 설정 → **Application restrictions** → IP 주소 또는 HTTP 리퍼러 제한
- **API restrictions** → "Cloud Translation API"만 허용

## 동작 방식

- **ja/zh** 사용자: `hostBioJa` / `hostBioZh`가 비어 있으면 Google API 호출 → 번역 후 DB 저장 → 표시
- **ko/en** 사용자: 번역 API 호출 없음 (hostBioKo, hostBio 사용)
- **캐시 무효화**: 호스트가 숙소 설명을 수정하면 `hostBioJa`, `hostBioZh` 자동 초기화 → 다음 ja/zh 조회 시 재번역

## 비용

- Google Cloud Translation API (Basic): [가격 정책](https://cloud.google.com/translate/pricing) 참고
- 500,000자/월 무료 티어 있음 (2024 기준)
- DB 캐시로 동일 숙소 재조회 시 API 호출 없음
