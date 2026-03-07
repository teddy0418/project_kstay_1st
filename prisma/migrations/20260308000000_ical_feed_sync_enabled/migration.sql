-- AlterTable ListingIcalFeed: 동기화 켜기/끄기 토글용
ALTER TABLE "ListingIcalFeed" ADD COLUMN IF NOT EXISTS "syncEnabled" BOOLEAN NOT NULL DEFAULT true;
