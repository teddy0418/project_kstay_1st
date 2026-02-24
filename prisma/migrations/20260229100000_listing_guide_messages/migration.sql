-- AlterTable
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkInGuideMessage" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "houseRulesMessage" TEXT;
