# 프로젝트 정리·점검 보고서

> 탐색 일자 기준으로 구조·패턴·중복·불일치를 정리한 문서입니다.

---

## 1. 폴더 구조 요약

| 디렉터리 | 용도 |
|----------|------|
| **app/** | Next.js App Router: 페이지·레이아웃·API. (guest), host, admin, api |
| **components/** | 공용 UI: layout, ui (검색·auth·토스트·모달 등), host(위저드·테이블·맵) |
| **features/** | 도메인 단위 UI: listings, home, search, browse, map, host |
| **lib/** | API 클라이언트, auth, DB(repositories), validation, 유틸 |
| **hooks/, locales/, types/, emails/** | 훅, 다국어, 타입, 이메일 템플릿 |

**애매한 경계**
- `components/` vs `features/`: 규칙이 없음. 리스팅 관련이 `components/host/listings/`와 `features/listings/`에 나뉨.
- `lib/`: repositories / services / 기타 유틸이 한곳에 섞여 있음.

---

## 2. 네이밍·패턴

- **폴더**: 대부분 kebab-case. 일부만 단일 단어(auth, host).
- **파일**: 컴포넌트는 PascalCase, lib/훅 등은 camelCase. 큰 불일치 없음.
- **API**: `app/api/` 아래 `route.ts` 일관 사용. 문제 없음.
- **AuthModalProvider**: `@/components/ui/AuthModalProvider`와 `@/components/ui/auth/AuthModalProvider` 두 경로로 같은 컴포넌트 참조 → 통일 필요.

---

## 3. 불필요·중복 코드

- **목록 데이터 혼용**
  - `lib/repositories/listings.ts`: DB + mock 병합/폴백.
  - `ProfileClient.tsx`: trips는 API(실예약), 리스팅 정보는 **mockData** 맵으로만 조회 → DB 전용 리스팅이면 프로필 "Your trips"에서 리스팅이 안 나올 수 있음.
- **날짜/숙박일 계산**
  - `lib/format.ts`: `diffNights`, `parseISODateUTC`, `formatDateRange` 등.
  - `lib/bookings/utils.ts`: `nightsBetween`, `formatDateEn`, `parseISODate` 등.
  - `BookingWidget.tsx`, `listings/[id]/page.tsx`: 각각 비슷한 포맷/파싱 로직 보유.
  - → 한 곳(`lib/dates.ts` 또는 `lib/format.ts`)으로 모으는 것이 좋음.
- **Auth re-export**: `components/ui/auth/AuthModalProvider.tsx`가 상위만 re-export. 경로 하나로 통일하면 정리됨.

---

## 4. 주요 불일치

- **API 호출**
  - **apiClient** 사용: host 리스팅, 결제·위시리스트, admin 등.
  - **raw fetch** 사용: 프로필(profile, bookings, reviews), 호스트 기본정보 프로필, exchange, geo, 결제 리다이렉트 등.
  - → 에러 처리·credentials·base URL을 맞추려면 apiClient로 통일하는 것이 좋음.
- **서버 vs 클라이언트**: 페이지는 서버, 폼/모달은 클라이언트로 나뉜 것은 의도적. 문서화만 하면 됨.
- **Auth**: 서버는 `getServerSessionUser()` 등, 클라이언트는 `useAuth()`. 구조는 괜찮음.

---

## 5. 정리 권장 사항 (우선순위)

### Phase 1 – 빠른 정리 (위험 낮음)
1. **AuthModalProvider import 통일**  
   한 경로만 사용(e.g. `@/components/ui/AuthModalProvider`)하고, `auth/AuthModalProvider.tsx` re-export 제거 또는 단일 진입점으로 정리.
2. **날짜/숙박일 유틸 통합**  
   `lib/format.ts` 또는 `lib/dates.ts` 하나로 `parseISO`, `formatDateEn`, `nightsBetween`(또는 `diffNights`) 통합 후, `BookingWidget`, `listings/[id]/page.tsx`, 기타 사용처에서 해당 모듈만 import.

### Phase 2 – 데이터 일관성
3. **ProfileClient "Your trips"**  
   trips는 이미 API(실예약)인데, 리스팅 정보만 mock 맵 사용 중.  
   - 예약 API에서 trip별 listing 요약을 함께 내려주거나,  
   - listing id로 기존 listing API(또는 배치)를 호출해, **DB 기준 리스팅만** 쓰도록 변경.
4. **listings 저장소**  
   프로필 등이 DB 리스팅만 쓰게 되면, `getPublicListings`/`getPublicListingById`의 mock 병합/폴백을 제거하고 DB 전용으로 전환 검토.

### Phase 3 – API·유틸 통일
5. **클라이언트 API 호출을 apiClient로**  
   프로필(profile, bookings, reviews), 호스트 기본정보 프로필, exchange, geo 등 raw `fetch`를 apiClient(또는 그 위의 작은 래퍼)로 교체.
6. **lib 구조 문서화**  
   repositories = 데이터 접근, services = 오케스트레이션, 나머지 = 순수 유틸/ auth/ API 등 한 줄 규칙을 README나 이 문서에 추가.

### Phase 4 – 선택 (구조 정리)
7. **components vs features 규칙**  
   예: "features = 페이지/도메인 블록, components = 재사용 UI·호스트 위젯" 등 한 문장으로 정한 뒤, 필요 시 점진적으로 이동.
8. **호스트 리스팅 UI 위치**  
   위저드·테이블을 `features/host/listings/`로 모을지, 현재처럼 `components/host/listings/` 유지할지 결정 후 일관 적용.

---

## 적용 완료 (Phase 1–2)

- **Phase 1**
  - AuthModalProvider: 모든 import를 `@/components/ui/AuthModalProvider`로 통일하고, `components/ui/auth/AuthModalProvider.tsx` re-export 파일 삭제.
  - 날짜/숙박일: `lib/format.ts`에 `nightsBetween`, `formatDateEn`, `addDays`, `parseISODate` 추가. `lib/bookings/utils.ts`는 해당 함수들을 format에서 re-export. `BookingWidget`, `listings/[id]/page`, `SearchBar`, `DateDropdown`에서 로컬 중복 제거 후 format 또는 bookings/utils 사용.
- **Phase 2**
  - ProfileClient "Recently viewed": mockData 제거. `GET /api/listings?ids=...`로 최근 본 목록 조회. `getPublicListingsByIds` 추가, 프로필에서 API 응답으로 카드 표시.
  - listings 저장소: `getPublicListings`에서 DB 결과가 있으면 mock 병합 없이 DB 결과만 반환. DB 비어 있거나 에러 시에만 mock 폴백 유지.

## 적용 완료 (Phase 3)

- **Phase 3 – apiClient 통일**
  - **ProfileClient**: `/api/user/profile` (GET/PATCH), `/api/bookings`, `/api/reviews` (GET/POST), `/api/listings?ids=...` → 모두 `apiClient` 사용.
  - **Host basics**: 프로필 GET/PATCH → `apiClient`.
  - **ExchangeRatesProvider**: `/api/exchange` → `apiClient`. API 응답을 `apiOk(rates)` 형식으로 통일.
  - **GeoDetector**: `/api/geo` → `apiClient`. API 응답을 `apiOk({ country, ...locale })` 형식으로 통일.
  - **Host location (autocomplete)**: `/api/geo/autocomplete?q=...` → `apiClient.get(..., { signal })`, 429 시 `ApiClientError`로 토스트.
  - **payment-redirect**: `/api/bookings/public/:token` → `apiClient.get`.

## 적용 완료 (Phase 4)

- **Phase 4 – 규칙·폴더 정리**
  - **규칙 문서**: `docs/CONVENTIONS.md` 추가. `features` = 도메인/페이지 블록, `components` = 재사용 UI·공용 위젯, lib 구조·API·네이밍 요약.
  - **호스트 리스팅 UI 이동**: `components/host/listings/` 아래 6개 파일을 `features/host/listings/`로 이동.
    - `ListingWizardContext.tsx`, `ListingWizardShell.tsx`, `HostListingsTable.tsx`, `HostListingImagesUrlEditor.tsx`, `LocationMap.tsx`, `HostListingNewEditor.tsx`
  - **import 경로**: 위저드·테이블·맵·이미지 에디터를 사용하는 `app/host/listings/**` 전부 `@/features/host/listings/...`로 변경. 기존 `components/host/listings/` 파일은 삭제.
