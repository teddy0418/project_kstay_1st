-- KSTAY: Payment 테이블에 amountKrw 컬럼 추가 (웹훅 금액 검증용)
-- 실행: Supabase SQL Editor / psql / 또는 npx prisma db execute --file prisma/sql/add-payment-amount-krw.sql

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountKrw" INTEGER;
