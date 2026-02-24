# KSTAY DB 스키마 점검 보고서

## 1) Executive Summary

### 현재 스키마의 강점 3개
1. **핵심 도메인 모델이 명확함**: User(게스트/호스트/관리자), Listing(Property 대응), Booking, Payment, Review, WishlistItem이 정의되어 있고, FK·relation이 정리되어 있음. Listing은 hostId FK로 User와 연결되며, Booking은 listingId·guestUserId로 이중 참조.
2. **결제·웹훅 감사 기반이 있음**: Payment 테이블에 provider, status, amountUsd/amountKrw, providerPaymentId, pgTid, rawJson이 있고, PaymentWebhookEvent에 (provider, webhookId) unique로 웹훅 중복 수신 시 1회만 처리(idempotency)가 코드에서 보장됨(webhook route에서 P2002 시 200 OK 반환).
3. **삭제 정책이 서비스 규칙과 맞음**: Listing 삭제는 DRAFT/REJECTED이며 예약 0건일 때만 허용(서버 검증 + Listing→Booking onDelete: Restrict). User 삭제 시 GuestBookings는 SetNull, Review/Wishlist는 Cascade로 고아 데이터 정리됨.

### 가장 큰 리스크 3개
1. **Payment.providerPaymentId에 unique 미적용**: 동일 PG 거래 ID가 다른 Payment 행에 들어갈 수 있어, 감사·중복 결제 방지가 DB 레벨에서 보장되지 않음.
2. **검색/필터 확장 한계**: Listing에 capacity(최대 인원), bedrooms, beds, bathrooms, minNights, maxNights가 없어 인원/숙박일수 필터가 불가. 가용성은 “Booking 기반 충돌 검사”만 있어, 대량 Listing·기간 검색 시 성능 이슈 가능.
3. **글로벌·정책 스냅샷 부족**: User에 locale/currency는 있으나 countryCode 없음. Booking/Listing에 취소정책 타입·무료취소 기한 스냅샷, property timezone, checkInGuide/houseRules 등이 없어 운영·고객지원 시 재현이 어려움.

### “글로벌 숙박 예약 플랫폼 기준” 총평(한 문장)
핵심 예약·결제·리뷰·호스트 소유권은 잘 잡혀 있고 웹훅 idempotency도 동작하나, 인원/가용성 검색 확장, 결제 식별자 unique, 취소정책·i18n·타임존 스냅샷이 보강되면 에어비앤비급 운영·검색·감사에 가까워진다.

---

## 2) Current ERD Summary

### 모델/관계 텍스트 ERD

```
User (id, role, email?, name, image?, displayName?, profilePhotoUrl?, locale, currency?, phone?)
  |-- HostProfile (1:1, onDelete: Cascade)
  |-- Listing[] as host ("HostListings", onDelete: Restrict)  [Property 대응]
  |-- Booking[] as guest ("GuestBookings", onDelete: SetNull)
  |-- WishlistItem[] (onDelete: Cascade)
  |-- Review[] (onDelete: Cascade)

HostProfile (userId PK, displayName?, payoutBank?, payoutAccount?, payoutName?)
  -- User (1:1)

Listing (id, hostId FK, status, approvedAt?, title, titleKo?/Ja?/Zh?, city, area, address, location?, lat?/lng?, basePriceKrw, rating, reviewCount, hostBio + i18n, checkInTime, checkOutTime?, amenities[])
  |-- ListingImage[] (onDelete: Cascade)
  |-- Booking[] (onDelete: Restrict)
  |-- WishlistItem[] (onDelete: Cascade)
  |-- Review[] (onDelete: Cascade)
  -- User as host (Restrict)

ListingImage (id, listingId FK, url, sortOrder)
  -- Listing (Cascade)

Booking (id, publicToken unique, listingId FK, guestUserId? FK, guestEmail, guestName?, checkIn, checkOut, nights, guestsAdults/Children/Infants/Pets, currency, totalUsd, totalKrw, status, confirmedAt?, cancellationDeadlineKst, confirmationEmailSentAt?)
  |-- Payment[] (onDelete: Cascade)
  |-- Review? (1:1, onDelete: Cascade)
  -- Listing (Restrict), User? as guest (SetNull)

Review (id, bookingId unique FK, userId FK, listingId FK, rating, body, cleanliness?~value?, createdAt)
  -- Booking (Cascade), User (Cascade), Listing (Cascade)

Payment (id, bookingId FK, provider, status, amountUsd, amountKrw?, providerPaymentId?, storeId?, pgTid?, rawJson?, createdAt, paidAt?)
  -- Booking (Cascade)

PaymentWebhookEvent (id, provider, webhookId, webhookTimestamp, webhookSignature, payloadRaw, parsedType?, paymentId?, receivedAt)
  @@unique([provider, webhookId])

WishlistItem (userId PK, listingId PK, createdAt)
  -- User (Cascade), Listing (Cascade)
```

- **Room**: 별도 모델 없음. Listing 1개 = Property 1개(또는 단일 Room)로 사용 중.

---

## 3) Relationship & Integrity Review

### 1) Booking이 반드시 참조하는 것
- **예**. 게스트: guestUserId?(FK User), guestEmail(필수), guestName? — 비로그인 예약 허용으로 guestUserId nullable.
- **예**. 숙소: listingId(FK Listing), Restrict.
- **예**. Room: 없음(Listing이 Property/Room 역할).
- **예**. 체크인/체크아웃: checkIn, checkOut, nights.
- **예**. 인원: guestsAdults/Children/Infants/Pets.
- **예**. 금액 스냅샷: totalUsd, totalKrw, currency.

### 2) Payment가 반드시 참조하는 것
- **예**. Booking: bookingId FK, Cascade.
- **예**. 금액/통화: amountUsd(필수), amountKrw?(웹훅 검증용).
- **예**. 상태: status (INITIATED/PAID/FAILED/CANCELLED).
- **부분**. 결제 고유 식별자: providerPaymentId?, pgTid? 있으나 **unique 아님** → 중복 방지는 애플리케이션에 의존.

### 3) Host/Owner 무결성
- **예**. Listing.hostId FK User, onDelete: Restrict.
- **예**. API에서 소유권 검사: `src/app/api/host/listings/[id]/route.ts`, `images/route.ts` 등에서 `findHostListingOwnership(listingId)` 후 `ownership.hostId !== user.id` 시 403. `src/lib/repositories/host-listings.ts`의 `deleteHostListing`는 hostId 일치 + DRAFT/REJECTED + 예약 0건만 삭제 허용.

### 4) 삭제 정책(onDelete)
- User 삭제: Booking은 SetNull(guestUserId만 null), Payment/Review는 Booking·Review가 Cascade로 정리. WishlistItem/Listing(호스트 소유)은 Cascade 또는 Restrict(Listing는 Restrict라 예약 있으면 User 삭제 자체가 FK로 차단 가능).
- Listing 삭제: Booking이 Restrict → 예약 있으면 삭제 불가. 서버에서도 DRAFT/REJECTED + 예약 0건만 삭제(`host-listings.ts`).
- **현재 위험**: 없음. “예약이 존재하면 숙소 삭제 금지”는 DB(Restrict) + 서버(deleteHostListing)에서 보장됨.

### 5) 유니크/제약
- **Payment.providerPaymentId**: unique 아님. index만 있음(`@@index([providerPaymentId])`). → **현재 위험**: 동일 PG 거래 ID가 여러 Payment에 들어가면 감사/중복 처리 혼란. **권장**: (provider, providerPaymentId) unique 조건 추가(비파괴, 단 providerPaymentId null 허용 시 unique partial index 검토).
- **Webhook idempotency**: **예**. `PaymentWebhookEvent`에 `@@unique([provider, webhookId])`. 웹훅 핸들러에서 create 실패 시 P2002면 "OK (duplicate webhook)" 반환(`payments/portone/webhook/route.ts`).
- **Booking 중복**: “같은 listing + 같은 날짜” 중복은 **애플리케이션**에서만 방지: `src/app/api/bookings/route.ts`에서 `overlapping = findFirst( listingId, status in [PENDING_PAYMENT, CONFIRMED], checkIn/checkOut 겹침 )` 후 있으면 409. DB에는 unique 제약 없음(동시성 시 race 가능성은 있으나, 트랜잭션·재시도로 완화 가능).

---

## 4) Global Readiness Review

### A) 게스트 선호 언어/국가/통화
- **User.locale**: 있음, default 'en-US'.
- **User.currency**: 있음, default 'USD'.
- **User.countryCode**: **없음** → 권장(ISO-3166).
- **Booking/Payment에 currency**: Booking.currency, Payment는 amountUsd/amountKrw로 예약·결제 당시 스냅샷 존재.

### B) i18n
- **Listing**: titleKo, titleJa, titleZh, hostBioKo/Ja/Zh 있음(필드 복제 방식).
- **긴 텍스트**: description, houseRules, checkInGuide 등 별도 필드 없음. 현재는 hostBio 정도만 i18n. 확장 시 필드 복제(titleKo 방식)로 추가 가능. 규모 커지면 Translation(key, locale, value) 테이블로 전환 옵션 가능(선택).

### C) 시간대/정책
- **체크인/체크아웃 시간**: Listing.checkInTime, checkOutTime?(문자열, 예: "15:00").
- **무료취소 기한**: Booking.cancellationDeadlineKst(DateTime). 정책 타입(cancellationPolicyType)이나 정책 스냅샷 필드는 없음.
- **타임존**: 고정(Asia/Seoul) 가정 코드 존재. Listing/Property별 timezone 필드 없음 → 글로벌 확장 시 권장.

---

## 5) Search & Availability Review

### A) 지역/주소
- **계층**: city, area, address, location?, lat?, lng? 있음. regionId 같은 상위 지역 테이블은 없음.
- **인덱스**: `(status, createdAt)`, `(hostId, createdAt)`, `(hostId, status, createdAt)`. **(city, area)** 또는 **(city)** 단일 인덱스는 없음 → 검색 시 full scan 가능성. 권장: (status, city), (status, area) 또는 (city), (area) 등 비파괴 ADD INDEX.
- **지리 검색**: lat/lng 있으나 PostGIS 없음. 반경 검색은 앱에서 필터 후 거리 계산 가능하나, 대량 데이터 시 인덱스 전략(PostGIS 또는 bbox 인덱스) 검토 권장(나중).

### B) 인원수
- **Listing**: **capacity(최대 인원), bedrooms, beds, bathrooms 없음** → 인원/침실 필터 불가. 필수 제안(ADD COLUMN).

### C) 날짜별 가용성
- **가용성 전용 테이블**: 없음(CalendarDay, Availability 등).
- **현재 방식**: Booking 기반. `getPublicListings(filters)`에서 `filters.start/end` 있으면 `bookings: { none: { status: CONFIRMED, checkIn < end, checkOut > start } }`로 “해당 기간에 CONFIRMED 예약 없는 Listing”만 조회(`listings.ts`). 즉 “예약만 있고 가용성은 계산”.
- **선택지**: (1) CalendarDay(listingId, date, blocked?, priceCents? 등) — 검색 최적화 유리. (2) 현재처럼 Booking 범위 충돌 — 구현 단순, Listing/예약 수 많아지면 느려질 수 있음.
- **결론**: 현재 단계(MVP)에서는 Booking 기반이 적절. 확장 시 CalendarDay(또는 유사) + (listingId, date) unique, (date) 인덱스 도입 권장.

### D) 편의시설(amenities)
- **Listing.amenities**: String[] (Prisma). Postgres GIN 인덱스 없음. amenities 포함 필터 시 배열 검색 가능하나, 대량이면 `CREATE INDEX ... ON "Listing" USING GIN (amenities);` 권장(P1).

---

## 6) Payment Security & Audit Review

### 1) Payment 권장 최소 세트
- **있음**: provider, status, amountUsd, amountKrw?, providerPaymentId?, storeId?, pgTid?, rawJson?, createdAt, paidAt?.
- **부족**: orderName/주문번호(선택), canceledAt?, REFUNDED 등 상태 확장은 enum 확장으로 대응 가능. paidAt 있음. providerTransactionId는 pgTid/providerPaymentId로 대체됨.

### 2) 웹훅 이력
- **PaymentWebhookEvent 존재**: id, provider, webhookId, webhookTimestamp, webhookSignature, payloadRaw, parsedType?, paymentId?, receivedAt.
- **없음**: signatureVerified(boolean), verificationError?, processedAt, processingResult. 현재는 라우트에서 verify 후 성공 시에만 create하므로 “저장된 건 = 서명 검증된 건”. 감사 강화 시 signatureVerified/processedAt 등 추가 권장(P2).

### 3) Idempotency
- **예**. PaymentWebhookEvent에 `@@unique([provider, webhookId])`. 중복 수신 시 create 실패 → P2002 → 200 OK 반환, 결제 처리 스킵.

---

## 7) Gaps vs Airbnb-like Platforms

| 항목 | 존재 여부 | 우선순위 | 비고 |
|------|-----------|----------|------|
| 취소/환불 정책 타입 | 없음 | P1 | cancellationPolicyType, 무료취소 기한 스냅샷(Booking에 있음: cancellationDeadlineKst) |
| 환불 규정/수수료 스냅샷 | 부분(기한만) | P1 | 정책명/수수료율 등 스냅샷 필드 권장 |
| 체크인 가이드/출입방법 | 없음 | P1 | checkInGuide, accessInfo 등 (긴 텍스트, i18n 고려) |
| 하우스 룰 | 없음 | P1 | houseRules |
| 숙소 유형(propertyType/roomType) | 없음 | P1 | 검색/필터용 |
| 침실/침대/욕실 수 | 없음 | P0(검색) | bedrooms, beds, bathrooms, capacity |
| minNights/maxNights | 없음 | P1 | Listing |
| 청소비/추가인원비/보증금 | 없음 | P2 | |
| 세금/서비스피 표시 | 없음(정책은 코드에) | P2 | |
| Review | 있음 | - | Booking 1:1, 6개 카테고리 별점 |
| 정산(payout) | HostProfile에 payoutBank 등 | P2 | 정산 배치/이력 테이블은 없음 |
| 메시지(Conversation/Message) | 없음 | P2 | |
| User.countryCode | 없음 | P1 | |
| Listing timezone | 없음 | P2 | 글로벌 확장 시 |
| Payment (provider, providerPaymentId) unique | 없음 | P0 | 중복 결제/감사 리스크 |

---

## 8) Recommended Changes

### DB-01 (P0) — Payment 거래 ID 유일성
- **목적**: PG 측 거래 ID 중복 저장 방지, 감사/중복 결제 방지.
- **Prisma**: `Payment` 모델에 `@@unique([provider, providerPaymentId])` 불가(providerPaymentId null 허용). 대신 `providerPaymentId`에 대해 “null이 아닐 때만” unique가 필요하면 PostgreSQL에서 partial unique index 사용.
- **SQL (비파괴)**:
```sql
-- providerPaymentId가 NOT NULL인 행만 (provider, providerPaymentId) unique
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerPaymentId_key"
ON "Payment"("provider", "providerPaymentId")
WHERE "providerPaymentId" IS NOT NULL;
```
- **영향도**: 낮음. 기존 데이터에 중복이 없으면 적용 가능. Prisma schema에는 동일 unique를 표현하기 어렵기 때문에, SQL로만 적용하고 Prisma에는 주석으로 명시 권장.
- **적용**: Supabase SQL Editor 또는 `prisma db execute`로 실행.

---

### DB-02 (P0) — Listing 인원/침실 필드 (검색 필터)
- **목적**: 인원·침실 수 검색/필터 가능.
- **Prisma**:
```prisma
// Listing 모델에 추가
maxGuests   Int?   // capacity
bedrooms    Int?
beds        Int?
bathrooms   Float? // or Int?
```
- **SQL**:
```sql
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxGuests" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bathrooms" DOUBLE PRECISION;
```
- **영향도**: 낮음. 기존 행은 null, 기본값 또는 마이그레이션 시 1 등으로 채우면 됨.
- **적용**: `prisma migrate dev` 또는 위 SQL 후 `prisma db pull`로 스키마 동기화.

---

### DB-03 (P1) — 지역 검색 인덱스
- **목적**: where status + city/area 검색 성능.
- **SQL**:
```sql
CREATE INDEX IF NOT EXISTS "Listing_status_city_idx" ON "Listing"("status", "city");
CREATE INDEX IF NOT EXISTS "Listing_status_area_idx" ON "Listing"("status", "area");
```
- **영향도**: 낮음.
- **적용**: migrate 또는 SQL Editor.

---

### DB-04 (P1) — amenities GIN 인덱스
- **목적**: amenities 배열 포함 검색 성능.
- **SQL**:
```sql
CREATE INDEX IF NOT EXISTS "Listing_amenities_gin_idx" ON "Listing" USING GIN ("amenities");
```
- **영향도**: 낮음.
- **참고**: Prisma schema에는 GIN 인덱스 정의가 없으므로 SQL로만 추가.

---

### DB-05 (P1) — User countryCode
- **목적**: 국가별 통계/정책/표시.
- **Prisma**: `User`에 `countryCode String?` (2자 ISO-3166).
- **SQL**:
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
```
- **영향도**: 낮음.

---

### DB-06 (P1) — Listing 정책/가이드 필드(스냅샷·i18n)
- **목적**: 취소정책 타입, 체크인 가이드, 하우스 룰 등 운영/고객지원.
- **Prisma**: Listing에 예시:
```prisma
cancellationPolicyType String?  // e.g. FLEXIBLE, MODERATE, STRICT
checkInGuide           String?  @db.Text
checkInGuideKo         String?  @db.Text
houseRules             String?  @db.Text
minNights              Int?
maxNights              Int?
```
- **SQL**:
```sql
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "cancellationPolicyType" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkInGuide" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkInGuideKo" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "houseRules" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "minNights" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxNights" INTEGER;
```
- **영향도**: 낮음. 기존 코드는 사용하는 필드만 사용하면 됨.

---

### DB-07 (P2) — PaymentWebhookEvent 감사 필드
- **목적**: 서명 검증 결과·처리 시각·결과 저장.
- **Prisma**: `signatureVerified Boolean?`, `processedAt DateTime?`, `processingResult String?` 등.
- **SQL**:
```sql
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "signatureVerified" BOOLEAN;
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "processingResult" TEXT;
```
- **영향도**: 낮음.

---

### (제안만, 실행 금지) — 파괴적 변경
- **DROP COLUMN / 타입 축소**: 하지 않음. 필요 시 별도 검토 후 마이그레이션 계획 수립.
- **CalendarDay(가용성) 테이블**: 규모 확장 시 신규 테이블로 추가 검토. 현재는 Booking 기반 유지.

---

### 적용 순서 제안
1. **DB-01** (Payment unique index) — 즉시 적용 권장.
2. **DB-02** (Listing maxGuests, bedrooms, beds, bathrooms) — 검색 필터용.
3. **DB-03, DB-04** (지역·amenities 인덱스) — 트래픽 증가 전에 적용.
4. **DB-05, DB-06** (countryCode, 정책/가이드) — 기능 개발과 함께.
5. **DB-07** (웹훅 감사) — 여유 있을 때.

운영/공유 DB이므로 `prisma migrate deploy` 전에 baseline 이슈가 있으면 `prisma migrate diff`로 SQL 생성 후 Supabase SQL Editor에서 검토·적용하는 방식을 권장한다.
