-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "storeId" TEXT;

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "webhookTimestamp" TEXT NOT NULL,
    "webhookSignature" TEXT NOT NULL,
    "payloadRaw" TEXT NOT NULL,
    "parsedType" TEXT,
    "paymentId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_webhookId_key"
ON "PaymentWebhookEvent"("provider", "webhookId");
