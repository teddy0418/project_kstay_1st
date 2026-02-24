# 프로젝트 구조·규칙 (Conventions)

## components vs features

- **`features/`**  
  **페이지/도메인 단위 블록.** 특정 화면·플로우에 묶인 UI와 로직.
  - 예: `features/listings/` (숙소 상세 카드·갤러리·예약 위젯), `features/home/`, `features/search/`, `features/host/` (호스트 대시·**호스트 숙소 등록 위저드·테이블·맵**).
  - 새 “기능”을 넣을 때: “어느 페이지/도메인에 속하는가?” → 해당 feature 폴더에 추가.

- **`components/`**  
  **여러 곳에서 쓰는 공용 UI·위젯.** 레이아웃, 버튼/모달/토스트, 폼 요소, 호스트 공통 메뉴 등.
  - 예: `components/layout/`, `components/ui/`, `components/host/` (HostTopRightMenus, tools 등 리스팅 위저드가 아닌 호스트 공용).

- **한 줄 요약**  
  `features` = 도메인/페이지 단위 블록, `components` = 재사용 UI·공용 위젯.

## lib/

- **`repositories/`** – DB·외부 데이터 접근 (Prisma, API 호출 등).
- **`services/`** – 유스케이스·오케스트레이션 (여러 repository/외부 호출 조합).
- **그 외** – auth, api client, validation, 순수 유틸(format, currency 등).

## API·클라이언트

- **브라우저에서 우리 API 호출** → `apiClient` (`@/lib/api/client`) 사용. 에러·JSON·타임아웃은 클라이언트에서 일괄 처리.
- **API 응답 형식** – 성공 시 `apiOk(data)`로 `{ data }` JSON 반환. 클라이언트는 `apiClient`가 반환하는 `data`만 사용.

## 파일·폴더 네이밍

- **폴더**: kebab-case (`listings-e2e`, `booking-confirmation-email`).
- **컴포넌트 파일**: PascalCase (`ListingWizardShell.tsx`, `ProfileClient.tsx`).
- **lib/훅/유틸**: camelCase (`mockData.ts`, `schemas.ts`).
