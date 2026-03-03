-- Add optional message from guest to host on bookings
ALTER TABLE "Booking" ADD COLUMN "guestMessageToHost" TEXT;

