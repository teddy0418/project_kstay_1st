import React from "react";
import { formatCancellationDeadlineKst, formatDateEn, formatUsdFromCents } from "@/lib/bookings/utils";
import BookingConfirmedEmail from "@/emails/BookingConfirmedEmail";
import { sendEmailWithResend } from "@/lib/email/resend";
import {
  findBookingForConfirmationEmailById,
  markBookingConfirmationEmailSentIfNeeded,
} from "@/lib/repositories/payment-processing";

export async function sendBookingConfirmedEmailIfNeeded(bookingId: string) {
  const booking = await findBookingForConfirmationEmailById(bookingId);
  if (!booking || booking.confirmationEmailSentAt || !booking.guestEmail) return;

  await sendEmailWithResend({
    to: booking.guestEmail,
    subject: "KSTAY booking confirmed",
    react: React.createElement(BookingConfirmedEmail, {
      bookingToken: booking.publicToken,
      listingTitle: booking.listing.title,
      checkIn: formatDateEn(booking.checkIn),
      checkOut: formatDateEn(booking.checkOut),
      guestsText: `${booking.guestsAdults} adults, ${booking.guestsChildren} children, ${booking.guestsInfants} infants, ${booking.guestsPets} pets`,
      totalText: `${formatUsdFromCents(booking.totalUsd)} / ₩${booking.totalKrw.toLocaleString()}`,
      cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
      manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"}/profile`,
    }),
  });

  await markBookingConfirmationEmailSentIfNeeded(booking.id);
}
