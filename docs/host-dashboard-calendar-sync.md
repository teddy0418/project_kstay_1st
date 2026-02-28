# 대시보드 ↔ 캘린더 연동 정리 (이번 주 예약 현황 / 판매 닫기·열기)

## 전체 흐름 요약

### 1. 대시보드 (이번 주 예약 현황)

- **경로**: `src/app/host/dashboard/page.tsx`
- **URL**: `/host/dashboard?listingId=xxx` (선택한 숙소만 적용)
- **데이터**: `getHostWeekTimeline(hostId, listingId)` → 오늘 포함 7일, 날짜별 예약 여부 + **판매 중지(blocked) 여부**
- **날짜 키**: 로컬 날짜 `YYYY-MM-DD` (`toLocalDateString`) → 예: 3월 1일 → `"2025-03-01"`
- **판매 닫기/열기**: `BlockDateButton` → `POST/DELETE /api/host/listings/[id]/blocked-dates` (해당 숙소만)

### 2. 캘린더 (통합 달력)

- **경로**: `src/app/host/calendar/page.tsx` + `src/features/host/calendar/HostCalendarTabs.tsx`
- **URL**: `/host/calendar?listingId=xxx` (같은 숙소 유지 가능)
- **데이터**: `GET /api/host/listings/[id]/blocked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD` → 해당 달의 차단일 목록
- **날짜 키**: 셀마다 로컬 `YYYY-MM-DD` (`year-month-day`) → 대시보드와 동일

### 3. 저장소·API

- **저장**: `ListingBlockedDate` (listingId + date). `date`는 DB에서 `DATE`(UTC 자정 해석).
- **차단 저장**: `blockDate(listingId, hostId, date)` → `toUtcDateOnly(date)`로 UTC 자정 저장.
- **차단 조회**: `getBlockedDates(listingId, from, to)` → `listingBlockedDate` + `listingIcalBlockedDate` 합쳐서 반환.

---

## 3월 1일 “대시보드에선 닫았는데 캘린더에선 열려 보임” 원인

1. **캘린더가 다른 숙소를 보고 있음**  
   - 캘린더 페이지는 예전에 **첫 번째 숙소(`firstId`)만** 초기 선택.  
   - 대시보드에서 "Clean room stay korea"를 선택한 뒤 3월 1일을 닫아도, 캘린더는 **목록의 첫 숙소**를 보고 있어서, 해당 숙소에는 3/1 차단이 없어 “열려 있음”으로 보였을 수 있음.

2. **이번 주 차단일 조회가 타임존에 따라 어긋날 수 있음**  
   - `getHostWeekTimeline`에서 `date: { gte: weekStart, lt: weekEnd }`로만 조회하면, 서버/DB 타임존에 따라 3월 1일이 범위에 안 잡힐 수 있음.

---

## 수정 사항

### 1. 캘린더에 `listingId` URL 연동

- **캘린더 페이지** (`src/app/host/calendar/page.tsx`)
  - `searchParams.listingId`를 읽어서, 유효한 숙소 ID면 **그 숙소를 초기 선택**하도록 변경.
  - 예: `/host/calendar?listingId=clean-room-stay-korea-id` → 캘린더가 해당 숙소로 열림.

- **HostCalendarTabs**
  - 숙소 선택을 바꿀 때마다 URL을 `?listingId=xxx`로 갱신 (`router.replace`).
  - 새로고침/다음 방문 시에도 같은 숙소가 선택되도록 유지.

### 2. 대시보드 → 캘린더로 “같은 숙소”로 이동

- 대시보드 **이번 주 예약 현황** 옆에 **“캘린더에서 보기”** 링크 추가.
  - 현재 선택된 `listingId`로 `/host/calendar?listingId=xxx` 이동.
  - “Clean room stay korea” 선택 후 이 링크로 가면, 캘린더도 같은 숙소로 열림.

### 3. 이번 주 차단일 조회를 타임존 안전하게

- **getHostWeekTimeline** (`src/lib/repositories/host-calendar.ts`)
  - “이번 주 7일”에 해당하는 **UTC 자정 7개 날짜**만 정확히 만들어서,  
    `date: { in: weekUtcDates }` 로 조회.
  - 서버/DB 타임존과 관계없이 3월 1일이 포함된 주면 3월 1일 차단이 항상 조회됨.

---

## 사용 방법 (동일 숙소로 연동 확인)

1. **대시보드**에서 숙소 선택: "Clean room stay korea".
2. **이번 주 예약 현황**에서 3월 1일 **판매 닫기**.
3. **“캘린더에서 보기”** 클릭 → `/host/calendar?listingId=...` 로 이동.
4. 캘린더가 **같은 숙소**로 열리고, 3월이 보이면 3월로 이동해 3/1이 **빨간색(판매 중지)**으로 보이는지 확인.

같은 숙소를 보는 상태에서도 3/1이 캘린더에 “열림”으로 보이면, 그때는 브라우저 캐시 없이 새로고침하거나, `blocked-dates` API 응답을 확인해 보면 됨.
