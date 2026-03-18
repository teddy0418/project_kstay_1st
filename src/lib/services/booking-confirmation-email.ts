import React from "react";
import {
  formatCancellationDeadlineKst,
  formatDateEn,
  formatUsdFromCents,
  formatPaymentAmount,
  formatApproxLocalFromKRW,
  getSettlementDisclaimer,
} from "@/lib/bookings/utils";
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

  const totalKrw = Number(booking.totalKrw) || 0;
  const accommodationKrw =
    booking.accommodationKrw != null && Number.isFinite(booking.accommodationKrw)
      ? Number(booking.accommodationKrw)
      : Math.round(totalKrw / 1.132);
  const guestServiceFeeKrw =
    booking.guestServiceFeeKrw != null && Number.isFinite(booking.guestServiceFeeKrw)
      ? Number(booking.guestServiceFeeKrw)
      : totalKrw - accommodationKrw;
  const nights = Number(booking.nights) || 1;
  const formatKrw = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

  await sendEmailWithResend({
    to: booking.guestEmail,
    subject: "KSTAY 예약 확정 / Booking confirmed",
    react: React.createElement(BookingConfirmedEmail, {
      bookingToken: booking.publicToken,
      listingTitle: listing.title,
      checkIn: formatDateEn(booking.checkIn),
      checkOut: formatDateEn(booking.checkOut),
      nights,
      guestsText: `${booking.guestsAdults} adults, ${booking.guestsChildren} children, ${booking.guestsInfants} infants, ${booking.guestsPets} pets`,
      accommodationKrwFormatted: formatKrw(accommodationKrw),
      guestServiceFeeKrwFormatted: formatKrw(guestServiceFeeKrw),
      totalKrwFormatted: formatKrw(totalKrw),
      totalUsdFormatted: formatUsdFromCents(booking.totalUsd),
      paymentAmountFormatted:
        booking.paymentCurrency && booking.paymentAmount != null
          ? formatPaymentAmount(
              booking.paymentCurrency as "USD" | "KRW" | "JPY",
              booking.paymentAmount
            )
          : null,
      approxLocalFormatted:
        booking.currency &&
        booking.paymentCurrency &&
        booking.currency !== booking.paymentCurrency
          ? formatApproxLocalFromKRW(booking.totalKrw, booking.currency)
          : null,
      settlementDisclaimer:
        booking.paymentCurrency != null
          ? getSettlementDisclaimer(booking.paymentCurrency as "USD" | "KRW" | "JPY")
          : null,
      cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
      manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "https://kstay.co.kr"}/profile`,
      checkInTime: listing.checkInTime ?? undefined,
      checkOutTime: listing.checkOutTime ?? undefined,
      checkInGuide: listing.checkInGuideMessage ?? undefined,
      houseRules: listing.houseRulesMessage ?? undefined,
      fullAddress: fullAddress || undefined,
    }),
  });

  await markBookingConfirmationEmailSentIfNeeded(booking.id);
}
