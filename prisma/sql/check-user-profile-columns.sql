-- KSTAY: User 테이블에 displayName, profilePhotoUrl 컬럼 존재 여부 확인
-- 실행: Supabase SQL Editor 또는 psql 등에서 실행 후 결과 행 수 확인
-- 결과 2행 = 두 컬럼 모두 있음, 1행 이하 = ADD COLUMN 필요

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'User'
  AND column_name IN ('displayName', 'profilePhotoUrl')
ORDER BY column_name;
