# 호스트 캘린더 ↔ 게스트 예약 가능일 연동

## 요약

- **호스트**가 캘린더/대시보드에서 판매 중지한 날짜와 **게스트**가 숙소 상세에서 보는 예약 불가일은 **같은 DB**를 사용해 연동됩니다.
- 게스트 API에 **iCal 차단일**이 빠져 있던 부분을 추가해, 호스트가 보는 차단일과 게스트가 보는 불가일이 동일한 기준이 되도록 맞춰 두었습니다.

---

## 데이터 소스 (동일)

| 구분 | 사용처 | 테이블/함수 |
|------|--------|-------------|
| 호스트 수동 판매 중지 | 호스트 캘린더, 대시보드 이번 주 현황 | `ListingBlockedDate` (getBlockedDates) |
| 호스트 iCal 연동 차단 | 호스트 캘린더, 대시보드 | `ListingIcalBlockedDate` (getBlockedDates) |
| 게스트 예약 불가일 | 숙소 상세 예약 위젯 | `GET /api/listings/[id]/unavailable-dates` |

**unavailable-dates API**는 다음을 합쳐서 반환합니다.

- **CONFIRMED** 예약 구간 (checkIn ~ checkOut)
- **ListingBlockedDate** (호스트가 수동으로 판매 중지한 날)
- **ListingIcalBlockedDate** (iCal 연동으로 차단된 날) ← 추가 반영됨

즉, 호스트가 “판매 중지” 또는 iCal로 막은 날은 게스트에게도 **예약 불가**로 보입니다.

---

## 흐름

1. **호스트**: 캘린더/대시보드에서 특정 날짜 **판매 중지** → `ListingBlockedDate`에 저장.
2. **게스트**: 숙소 상세 페이지에서 `GET /api/listings/[id]/unavailable-dates` 호출 → 응답의 `ranges`에 위 차단일 포함.
3. **BookingWidget**: `disabledRanges`로 날짜 선택기에서 해당 구간 비활성화 → 게스트가 그 날짜를 선택할 수 없음.

날짜 형식은 모두 **YYYY-MM-DD**로 맞춰져 있어 비교·연동에 문제 없습니다.

---

## 수정 사항 (연동 보강)

- **게스트 API** `GET /api/listings/[id]/unavailable-dates`에서  
  `ListingIcalBlockedDate`를 함께 조회해 `ranges`에 넣도록 수정했습니다.
- 이제 호스트 캘린더에서 보는 “차단일”(수동 + iCal)과 게스트가 보는 “예약 불가일”이 같은 기준으로 맞습니다.
