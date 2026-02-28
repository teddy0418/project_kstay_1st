-- AlterTable Listing: iCal 연동 필드 (스키마와 DB 동기화)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "icalUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "icalLastSyncedAt" TIMESTAMP(3);
