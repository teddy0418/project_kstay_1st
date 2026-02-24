-- Add amountKrw for KRW payment amount verification (webhook)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountKrw" INTEGER;
