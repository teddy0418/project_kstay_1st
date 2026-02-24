# KSTAY DB 스키마 개선(P0/P1) — 안전 적용 가이드

운영/공유 Supabase DB용. **파괴적 변경(DROP) 없음.**  
Supabase SQL Editor에서 **Pre-check** 실행 후 결과 확인, 이어서 **Safe Apply** 실행.

---

## Pre-check SQL (duplicates / exists)

실행 순서: 1 → 2 → 3. 중복이 있으면 해당 섹션의 Safe Apply 인덱스는 건너뛸 것.

```sql
-- =============================================================================
-- 1) Payment: providerPaymentId 중복 여부 (NULL 제외)
-- =============================================================================
SELECT "provider", "providerPaymentId", COUNT(*) AS cnt
FROM "Payment"
WHERE "providerPaymentId" IS NOT NULL
GROUP BY "provider", "providerPaymentId"
HAVING COUNT(*) > 1;
-- 결과가 0 rows 이면 → Safe Apply의 Payment_provider_providerPaymentId_key 생성 가능.

-- =============================================================================
-- 2) Payment: pgTid 중복 여부 (NULL 제외)
-- =============================================================================
SELECT "pgTid", COUNT(*) AS cnt
FROM "Payment"
WHERE "pgTid" IS NOT NULL
GROUP BY "pgTid"
HAVING COUNT(*) > 1;
-- 결과가 0 rows 이면 → pgTid partial unique index 적용 가능.

-- =============================================================================
-- 3) 이미 존재하는 컬럼/인덱스 확인 (선택)
-- =============================================================================
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Listing'
  AND column_name IN ('maxGuests','bedrooms','beds','bathrooms');
-- 0 rows 이면 새 컬럼 추가 필요. 4 rows 이면 이미 적용됨.

SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'Listing'
  AND indexname IN ('Listing_status_city_idx','Listing_status_area_idx','Listing_amenities_gin_idx');
-- 적용 전: 0 rows. 적용 후: 3 rows 확인용.
```

---

## Safe Apply SQL (IF NOT EXISTS only)

**Pre-check 1에서 중복이 없을 때만** 아래 Payment 인덱스 블록 실행.  
Pre-check 2에서 pgTid 중복이 없을 때만 pgTid 인덱스 블록 실행.

```sql
-- =============================================================================
-- A) Listing: 검색/필터용 컬럼 추가
-- =============================================================================
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxGuests"   INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bedrooms"    INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds"        INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bathrooms"   DOUBLE PRECISION;

-- =============================================================================
-- B) Payment: partial unique (provider + providerPaymentId)
--    Pre-check 1에서 중복 0건일 때만 실행 권장.
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerPaymentId_key"
ON "Payment"("provider", "providerPaymentId")
WHERE "providerPaymentId" IS NOT NULL;

-- =============================================================================
-- C) Payment: pgTid partial unique (선택, Pre-check 2에서 중복 0건일 때만)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pgTid_key"
ON "Payment"("pgTid")
WHERE "pgTid" IS NOT NULL;

-- =============================================================================
-- D) Listing: 검색 성능 인덱스
-- =============================================================================
CREATE INDEX IF NOT EXISTS "Listing_status_city_idx"  ON "Listing"("status", "city");
CREATE INDEX IF NOT EXISTS "Listing_status_area_idx"  ON "Listing"("status", "area");
CREATE INDEX IF NOT EXISTS "Listing_amenities_gin_idx" ON "Listing" USING GIN ("amenities");

-- =============================================================================
-- E) Booking: 가용성 검색용 복합 인덱스 제안
-- =============================================================================
CREATE INDEX IF NOT EXISTS "Booking_listingId_status_checkIn_checkOut_idx"
ON "Booking"("listingId", "status", "checkIn", "checkOut");
```

---

## schema.prisma changes (diff)

`prisma/schema.prisma`의 `Listing` 모델에 아래 필드 추가.  
(GIN 인덱스·partial unique는 Prisma에서 표현 제한이 있어 스키마에는 optional로만 반영하고, 실제 인덱스는 위 Safe Apply SQL로 적용.)

```diff
 model Listing {
   ...
   amenities    String[] @default([])
+  maxGuests    Int?     // 검색/필터용 최대 인원
+  bedrooms     Int?
+  beds         Int?
+  bathrooms    Float?
 
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ...
   @@index([hostId, status, createdAt])
 }
```

- `Payment`의 partial unique는 Prisma schema에 표현하지 않고, SQL로만 적용. (주석으로 남겨두면 좋음.)
- `Booking`의 새 인덱스는 Prisma에 넣으려면:

```diff
 model Booking {
   ...
   @@index([listingId, status])
   @@index([guestUserId, status])
+  @@index([listingId, status, checkIn, checkOut])
 }
```

---

## How to verify (5줄)

1. **Pre-check 1·2 재실행** → `providerPaymentId` / `pgTid` 중복 조회 결과 0 rows.
2. **Listing 컬럼**: `SELECT "maxGuests","bedrooms","beds","bathrooms" FROM "Listing" LIMIT 1;` → 4개 컬럼 존재, 기존 행은 NULL 가능.
3. **인덱스 존재**: `docs/DB_SAFE_APPLY_P0P1.sql`의 PART 3 확인용 SELECT 실행 → `Listing_status_city_idx`, `Listing_amenities_gin_idx`, `Payment_provider_providerPaymentId_key`, `Booking_listingId_status_checkIn_checkOut_idx` 등 노출 확인.
4. **앱 동작**: 기존 예약/결제/숙소 목록·검색 API 호출 후 에러 없이 응답 오는지 확인.
5. **Prisma**: 로컬에서 `npx prisma generate` 실행 후, `Listing` 타입에 `maxGuests`, `bedrooms`, `beds`, `bathrooms` 포함되는지 확인.

---

## Prisma client 동기화

`schema.prisma`에 `Listing` 필드와 `Booking` 인덱스를 반영한 뒤:

```bash
npx prisma generate
```

DB에 컬럼/인덱스는 이미 Safe Apply SQL로 넣었으면, `migrate` 없이 `generate`만 해도 클라이언트 타입과 일치.  
(마이그레이션 이력을 맞추려면 `prisma migrate dev --name add_listing_search_and_indexes` 로 migration 파일 생성 후 적용할 수 있음.)
