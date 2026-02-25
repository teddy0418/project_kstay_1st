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

  const listing = booking.listing as {
    title: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    checkInGuideMessage: string | null;
    houseRulesMessage: string | null;
    address?: string | null;
    roadAddress?: string | null;
    detailedAddress?: string | null;
    city?: string | null;
    area?: string | null;
    stateProvince?: string | null;
    cityDistrict?: string | null;
    zipCode?: string | null;
  };
  const baseAddr = [listing.roadAddress?.trim(), listing.address?.trim()].find(Boolean) ?? "";
  const detail = listing.detailedAddress?.trim();
  const fullAddress = detail ? `${baseAddr} ${detail}`.trim() : baseAddr;

  await sendEmailWithResend({
    to: booking.guestEmail,
    subject: "KSTAY booking confirmed",
    react: React.createElement(BookingConfirmedEmail, {
      bookingToken: booking.publicToken,
      listingTitle: listing.title,
      checkIn: formatDateEn(booking.checkIn),
      checkOut: formatDateEn(booking.checkOut),
      guestsText: `${booking.guestsAdults} adults, ${booking.guestsChildren} children, ${booking.guestsInfants} infants, ${booking.guestsPets} pets`,
      totalText: `${formatUsdFromCents(booking.totalUsd)} / ₩${booking.totalKrw.toLocaleString()}`,
      cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
      manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3001"}/profile`,
      checkInTime: listing.checkInTime ?? undefined,
      checkOutTime: listing.checkOutTime ?? undefined,
      checkInGuide: listing.checkInGuideMessage ?? undefined,
      houseRules: listing.houseRulesMessage ?? undefined,
      fullAddress: fullAddress || undefined,
    }),
  });

  await markBookingConfirmationEmailSentIfNeeded(booking.id);
}
