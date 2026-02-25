-- AlterTable Listing: 가격·환불 설정
ALTER TABLE "Listing" ADD COLUMN "weekendSurchargePct" INTEGER DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN "peakSurchargePct" INTEGER DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN "nonRefundableSpecialEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "freeCancellationDays" INTEGER DEFAULT 5;

-- AlterTable Booking: 취소 정책 스냅샷
ALTER TABLE "Booking" ADD COLUMN "isNonRefundableSpecial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "cancellationPolicyVersion" TEXT;
ALTER TABLE "Booking" ADD COLUMN "policyTextLocale" TEXT;
ALTER TABLE "Booking" ADD COLUMN "policyType" TEXT;
ALTER TABLE "Booking" ADD COLUMN "freeCancelEndsAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "refundSchedule" TEXT;
ALTER TABLE "Booking" ADD COLUMN "policyAgreedAt" TIMESTAMP(3);
