-- KSTAY Black: 관리자 선정 숙소 노출용 정렬 순서
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "kstayBlackSortOrder" INTEGER;

CREATE INDEX IF NOT EXISTS "Listing_kstayBlackSortOrder_idx" ON "Listing"("kstayBlackSortOrder");
