-- AlterTable
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "businessRegistrationDocUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "lodgingReportDocUrl" TEXT;
