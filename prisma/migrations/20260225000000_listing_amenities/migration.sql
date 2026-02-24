-- AlterTable: Listing amenities (non-destructive ADD COLUMN only)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[];
