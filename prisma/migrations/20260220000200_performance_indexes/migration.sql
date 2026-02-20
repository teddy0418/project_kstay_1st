-- Listing query performance indexes
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");
CREATE INDEX "Listing_hostId_createdAt_idx" ON "Listing"("hostId", "createdAt");
CREATE INDEX "Listing_hostId_status_createdAt_idx" ON "Listing"("hostId", "status", "createdAt");

-- Booking query performance indexes
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");
CREATE INDEX "Booking_listingId_status_idx" ON "Booking"("listingId", "status");
CREATE INDEX "Booking_guestUserId_status_idx" ON "Booking"("guestUserId", "status");

-- Payment query performance indexes
CREATE INDEX "Payment_bookingId_createdAt_idx" ON "Payment"("bookingId", "createdAt");

-- Wishlist query performance indexes
CREATE INDEX "WishlistItem_userId_createdAt_idx" ON "WishlistItem"("userId", "createdAt");
