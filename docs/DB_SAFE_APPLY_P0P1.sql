-- =============================================================================
-- KSTAY DB 스키마 개선(P0/P1) — Supabase SQL Editor용 한 파일
-- 파괴적 변경 없음. 1) Pre-check 실행 → 결과 확인 → 2) Safe Apply 실행
-- =============================================================================

-- ##############################################################################
-- PART 1: Pre-check SQL (duplicates / exists)
-- ##############################################################################

-- 1) Payment: providerPaymentId 중복 (NULL 제외) — 0 rows여야 Safe Apply B 실행
SELECT "provider", "providerPaymentId", COUNT(*) AS cnt
FROM "Payment"
WHERE "providerPaymentId" IS NOT NULL
GROUP BY "provider", "providerPaymentId"
HAVING COUNT(*) > 1;

-- 2) Payment: pgTid 중복 (NULL 제외) — 0 rows여야 Safe Apply C 실행
SELECT "pgTid", COUNT(*) AS cnt
FROM "Payment"
WHERE "pgTid" IS NOT NULL
GROUP BY "pgTid"
HAVING COUNT(*) > 1;

-- 3) Listing 새 컬럼 존재 여부 (0 rows = 아직 없음, 4 rows = 이미 적용됨)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Listing'
  AND column_name IN ('maxGuests','bedrooms','beds','bathrooms');

-- ##############################################################################
-- PART 2: Safe Apply SQL (IF NOT EXISTS only)
-- Pre-check 1·2에서 중복 0건 확인 후 아래 블록 실행
-- ##############################################################################

-- A) Listing: 검색/필터용 컬럼
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxGuests"   INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bedrooms"    INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds"        INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bathrooms"   DOUBLE PRECISION;

-- B) Payment: partial unique (provider + providerPaymentId)
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerPaymentId_key"
ON "Payment"("provider", "providerPaymentId")
WHERE "providerPaymentId" IS NOT NULL;

-- C) Payment: pgTid partial unique
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pgTid_key"
ON "Payment"("pgTid")
WHERE "pgTid" IS NOT NULL;

-- D) Listing: 검색 성능 인덱스
CREATE INDEX IF NOT EXISTS "Listing_status_city_idx"  ON "Listing"("status", "city");
CREATE INDEX IF NOT EXISTS "Listing_status_area_idx"  ON "Listing"("status", "area");
CREATE INDEX IF NOT EXISTS "Listing_amenities_gin_idx" ON "Listing" USING GIN ("amenities");

-- E) Booking: 가용성 검색용 복합 인덱스
CREATE INDEX IF NOT EXISTS "Booking_listingId_status_checkIn_checkOut_idx"
ON "Booking"("listingId", "status", "checkIn", "checkOut");

-- ##############################################################################
-- PART 3: 실행 후 확인용 SELECT
-- ##############################################################################

-- 새 컬럼 4개 확인
SELECT "maxGuests","bedrooms","beds","bathrooms" FROM "Listing" LIMIT 1;

-- 추가된 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'Listing' OR tablename = 'Payment' OR tablename = 'Booking')
  AND (indexname LIKE '%status_city%' OR indexname LIKE '%status_area%'
       OR indexname LIKE '%amenities_gin%' OR indexname LIKE '%provider_providerPaymentId%'
       OR indexname LIKE '%pgTid_key%' OR indexname LIKE '%listingId_status_checkIn%');
