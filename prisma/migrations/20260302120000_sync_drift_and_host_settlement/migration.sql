-- Drift: 현재 DB에 이미 적용된 스키마를 마이그레이션 히스토리에 반영 (IF NOT EXISTS로 안전 적용)
-- + HostSettlement 테이블 추가

-- Booking: (listingId, status, checkIn, checkOut) 복합 인덱스
CREATE INDEX IF NOT EXISTS "Booking_listingId_status_checkIn_checkOut_idx" ON "Booking"("listingId", "status", "checkIn", "checkOut");

-- Listing: 최대 인원·침실·침대·욕실
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxGuests" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bathrooms" DOUBLE PRECISION;

-- Review: 6개 카테고리 별점
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "cleanliness" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "accuracy" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "checkIn" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "communication" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "location" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "value" INTEGER;

-- 정산 이력: 호스트별·회차별 지급 기록
CREATE TABLE "HostSettlement" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodEndAt" DATE NOT NULL,
    "totalKrw" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HostSettlement_hostId_periodEndAt_idx" ON "HostSettlement"("hostId", "periodEndAt");
CREATE INDEX "HostSettlement_status_periodEndAt_idx" ON "HostSettlement"("status", "periodEndAt");

ALTER TABLE "HostSettlement" ADD CONSTRAINT "HostSettlement_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
