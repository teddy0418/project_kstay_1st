-- CreateTable: Review (one per booking, guest writes after stay)
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one review per booking
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
