# 수동 판매 중지가 게스트에 반영 안 되는 원인 파악

## 전체 흐름

1. **호스트**가 캘린더/대시보드에서 날짜 **판매 중지**  
   → `POST /api/host/listings/[id]/blocked-dates` body `{ date: "2025-03-01" }`  
   → `blockDate()` → `toUtcDateOnly(date)` → **ListingBlockedDate** 에 `listingId` + `date`(UTC 자정) 저장

2. **게스트**가 숙소 상세에서 날짜 선택  
   → `BookingWidget` 이 `GET /api/listings/[id]/unavailable-dates` 호출  
   → 응답 `ranges` 를 `disabledRanges` 로 저장  
   → **DateDropdown** 에서 `disabled={(date) => isDateInRanges(date, disabledRanges)}`  
   → `isDateInRanges`: `toISO(date) >= r.from && toISO(date) < r.to`

3. **예약 버튼**  
   → `overlapsDisabled = disabledRanges.some((r) => checkInISO < r.to && checkOutISO > r.from)`  
   → true 이면 버튼 비활성 + 예약 불가

---

## 원인 1: 단일일 차단이 캘린더에서 비활성 처리 안 됨 (이미 수정됨)

- API가 차단된 **하루**를 `{ from: "2025-03-01", to: "2025-03-01" }` 로 내려줌.
- DateDropdown 은 **끝 미포함** 구간만 사용: `d >= r.from && d < r.to`.
- `from === to` 이면 `d < r.to` 가 false → 그날이 비활성으로 잡히지 않음.

**수정:** 차단된 하루는 `{ from: "2025-03-01", to: "2025-03-02" }` 로 반환.

---

## 원인 2: DB DATE 를 Date 로 읽을 때 서버 타임존으로 하루 밀림 (이번에 수정)

- **저장:** `toUtcDateOnly(date)` → Postgres **DATE** 컬럼에 `2025-03-01` 저장.
- **조회:** `prisma.listingBlockedDate.findMany()` → Prisma/Node 가 DATE 를 **JavaScript Date** 로 변환.
- 서버가 **KST** 등이면, DB의 `2025-03-01` 이 “로컬 자정 2025-03-01” 로 해석될 수 있음  
  → 내부적으로 `2025-02-28T15:00:00.000Z` (UTC)  
  → `getUTCFullYear/getUTCMonth/getUTCDate` 또는 `toISOString().slice(0,10)` 시 **2025-02-28** 로 나옴.
- 결과: 호스트는 “3월 1일”을 막았는데, 게스트 API 는 **2월 28일**만 비활성으로 내려줌 → **3월 1일이 그대로 선택 가능**.

**수정:** 게스트 API 에서 차단일을 **Prisma Date 가 아닌, DB 에서 문자열로** 읽도록 변경.

- `prisma.$queryRaw\`SELECT "date"::text AS date FROM "ListingBlockedDate" WHERE "listingId" = ...\``
- Postgres `date::text` 는 타임존 없이 `'2025-03-01'` 형태로 반환.
- 이 문자열을 그대로 `from`/`to` 에 사용 → 서버 타임존과 무관하게 **호스트가 막은 날짜와 동일한 YYYY-MM-DD** 가 게스트에게 전달됨.

---

## 원인 3: 캐시 (이미 수정됨)

- GET 응답/브라우저 캐시로 예전 `ranges` 가 쓰이면, 방금 막은 날이 반영 안 된 것처럼 보임.
- **수정:** API 에 `Cache-Control: no-store`, BookingWidget 에 `fetch(..., { cache: "no-store" })` 적용.

---

## 수정 요약

| 구분 | 내용 |
|------|------|
| 단일일 구간 | 차단된 하루는 `{ from: d, to: nextDayYmd(d) }` 로 반환해 DateDropdown 비활성 조건(`d < r.to`)에 맞춤. |
| 차단일 읽기 | `ListingBlockedDate` / `ListingIcalBlockedDate` 의 `date` 를 **$queryRaw 로 date::text** 조회해, 타임존 영향 없이 YYYY-MM-DD 사용. |
| 캐시 | unavailable-dates API Cache-Control, BookingWidget fetch cache: "no-store". |

이렇게 하면 **수동 판매 중지한 날짜**가 게스트 쪽에서도 같은 날짜로 비활성 처리되고, 예약 불가로 이어짐.
