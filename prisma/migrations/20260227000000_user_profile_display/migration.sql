-- Add profile display name and photo URL for reviews (safe to run multiple times)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
