-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "accommodationKrw" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guestServiceFeeKrw" INTEGER;
