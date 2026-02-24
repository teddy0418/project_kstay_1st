-- CreateTable
CREATE TABLE "ListingBlockedDate" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "ListingBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingDatePrice" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "priceKrw" INTEGER NOT NULL,

    CONSTRAINT "ListingDatePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingBlockedDate_listingId_date_key" ON "ListingBlockedDate"("listingId", "date");

-- CreateIndex
CREATE INDEX "ListingBlockedDate_listingId_idx" ON "ListingBlockedDate"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingDatePrice_listingId_date_key" ON "ListingDatePrice"("listingId", "date");

-- CreateIndex
CREATE INDEX "ListingDatePrice_listingId_idx" ON "ListingDatePrice"("listingId");

-- AddForeignKey
ALTER TABLE "ListingBlockedDate" ADD CONSTRAINT "ListingBlockedDate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ListingCalendarMemo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "memo" TEXT NOT NULL,

    CONSTRAINT "ListingCalendarMemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingCalendarMemo_listingId_date_key" ON "ListingCalendarMemo"("listingId", "date");

-- CreateIndex
CREATE INDEX "ListingCalendarMemo_listingId_idx" ON "ListingCalendarMemo"("listingId");

-- AddForeignKey
ALTER TABLE "ListingDatePrice" ADD CONSTRAINT "ListingDatePrice_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCalendarMemo" ADD CONSTRAINT "ListingCalendarMemo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
