-- AlterTable: Listing checkOutTime (optional, UI/API already send it)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT;
