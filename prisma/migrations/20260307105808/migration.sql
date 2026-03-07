/*
  Warnings:

  - You are about to drop the `ListingCalendarMemo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ListingCalendarMemo" DROP CONSTRAINT "ListingCalendarMemo_listingId_fkey";

-- DropTable
DROP TABLE "ListingCalendarMemo";

-- CreateTable
CREATE TABLE "ListingIcalFeed" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "color" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingIcalFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingIcalBlockedDate" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "ListingIcalBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingIcalFeed_listingId_idx" ON "ListingIcalFeed"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingIcalFeed_listingId_url_key" ON "ListingIcalFeed"("listingId", "url");

-- CreateIndex
CREATE INDEX "ListingIcalBlockedDate_listingId_idx" ON "ListingIcalBlockedDate"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingIcalBlockedDate_listingId_date_key" ON "ListingIcalBlockedDate"("listingId", "date");

-- AddForeignKey
ALTER TABLE "ListingIcalFeed" ADD CONSTRAINT "ListingIcalFeed_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingIcalBlockedDate" ADD CONSTRAINT "ListingIcalBlockedDate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
