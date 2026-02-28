# 수동 판매 중지가 게스트에 반영 안 되던 문제 정리

## 원인 (두 가지)

### 1. 단일일 차단 구간이 캘린더에서 비활성화되지 않음

- **게스트 API**는 차단된 하루를 `{ from: "2025-03-01", to: "2025-03-01" }` 로 내려줌.
- **DateDropdown**의 비활성 조건은 `d >= r.from && d < r.to` (구간을 **끝 미포함**으로 처리).
- `to === from` 이면 `d < r.to` 가 항상 false라서, **그날이 비활성화되지 않음**.

→ 차단된 하루는 **끝 날을 다음 날로** 보내도록 수정: `{ from: "2025-03-01", to: "2025-03-02" }`.

### 2. 날짜 문자열이 서버 타임존에 따라 어긋남

- DB의 `ListingBlockedDate.date`를 `b.date.toISOString().slice(0, 10)` 로만 변환하면, 서버가 KST 등이었을 때 UTC 기준으로 하루 밀리거나 당겨질 수 있음.
- 호스트가 “3월 1일”을 막았는데, 게스트 API가 “2월 28일” 또는 “3월 2일”만 비활성으로 내려주는 식의 불일치 가능.

→ **UTC 기준**으로 `YYYY-MM-DD` 를 만들도록 수정: `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` 사용.

---

## 수정 사항

| 위치 | 내용 |
|------|------|
| **GET /api/listings/[id]/unavailable-dates** | (1) 차단 단일일은 `from: d, to: nextDayYmd(d)` 로 반환 (2) 모든 날짜를 `toYmdUtc()` 로 UTC 기준 YYYY-MM-DD 생성 (3) 응답에 `Cache-Control: no-store` 추가 |
| **BookingWidget** | unavailable-dates 요청 시 `fetch(..., { cache: "no-store" })` 로 캐시 없이 호출 |

이제 호스트가 수동으로 판매 중지한 날짜가 게스트 날짜 선택기에서 비활성으로 보이고, 예약 불가 구간 검사도 그대로 동작합니다.
