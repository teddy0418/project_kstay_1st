# Listing.amenities 컬럼 확인 및 추가 (비파괴)

## 1) 컬럼 존재 여부 확인 (information_schema)

Supabase SQL Editor 또는 psql에서 실행:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Listing'
  AND column_name = 'amenities';
```

- **결과가 1행:** 컬럼이 이미 있음. 추가 작업 불필요.
- **결과가 0행:** 아래 ADD COLUMN 실행.

---

## 2) 컬럼이 없을 때만 실행 (ADD COLUMN, 비파괴)

Supabase SQL Editor에서 실행 (실행은 사용자가 선택):

```sql
-- AlterTable: Listing amenities (non-destructive ADD COLUMN only)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

- `IF NOT EXISTS` 로 중복 실행해도 오류 없음.
- DROP/기존 데이터 변경 없음.
