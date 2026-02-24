-- KSTAY: User 테이블에 프로필 컬럼 비파괴 추가 (이미 있으면 무시)
-- 실행: Supabase SQL Editor / psql / 또는 npx prisma db execute --file prisma/sql/add-user-profile-columns.sql

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
