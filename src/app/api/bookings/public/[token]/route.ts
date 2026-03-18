import { apiError, apiOk } from "@/lib/api/response";
import {
  formatCancellationDeadlineKst,
  formatDateEn,
  formatUsdFromCents,
  formatPaymentAmount,
  formatApproxLocalFromKRW,
  getSettlementDisclaimer,
} from "@/lib/bookings/utils";
import { findPublicBookingByToken } from "@/lib/repositories/bookings";
import { cancelGuestBookingByToken } from "@/lib/repositories/payment-processing";
import { cancelPortonePayment } from "@/lib/portone/cancel";

/** POST: 게스트 예약 취소. 무료 취소 기한 내에서만 성공. */
export async function POST(_: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

    const result = await cancelGuestBookingByToken(token);
    if (!result.ok) {
      if (result.reason === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Booking not found");
      if (result.reason === "NOT_CONFIRMED") return apiError(409, "INVALID_STATE", "Only confirmed bookings can be cancelled");
      if (result.reason === "FREE_CANCEL_EXPIRED") return apiError(400, "FREE_CANCEL_EXPIRED", "Free cancellation deadline has passed");
      return apiError(400, "BAD_REQUEST", "Cannot cancel");
    }

    const providerMode = (process.env.PAYMENT_PROVIDER || "MOCK").toUpperCase();
    if (providerMode === "PORTONE") {
      const refundResult = await cancelPortonePayment(token, "Guest free cancellation");
      if (!refundResult.ok) {
        console.error("[api/bookings/public/:token] PortOne refund failed", refundResult.reason);
      }
    }

    return apiOk({ cancelled: true, bookingId: result.bookingId });
  } catch (error) {
    console.error("[api/bookings/public/:token] POST cancel failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to cancel booking");
  }
}

export async function GET(_: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

    const booking = await findPublicBookingByToken(token);

    if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");

    const listing = booking.listing as {
      id: string;
      title: string;
      city: string;
      area: string;
      address: string;
      checkInTime?: string | null;
      images?: Array<{ url: string }>;
    };
    const imageUrl = listing.images?.[0]?.url ?? null;
    return apiOk({
      token: booking.publicToken,
      status: booking.status,
      guestEmail: booking.guestEmail,
      listing: {
        id: listing.id,
        title: listing.title,
        city: listing.city,
        area: listing.area,
        address: listing.address,
        checkInTime: listing.checkInTime ?? "15:00",
        imageUrl,
      },
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: booking.nights,
      guests: {
        adults: booking.guestsAdults,
        children: booking.guestsChildren,
        infants: booking.guestsInfants,
        pets: booking.guestsPets,
      },
      totals: {
        currency: booking.currency,
        usd: booking.totalUsd,
        krw: booking.totalKrw,
        usdText: formatUsdFromCents(booking.totalUsd),
        paymentCurrency: booking.paymentCurrency ?? null,
        paymentAmount: booking.paymentAmount ?? null,
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
      },
      checkInText: formatDateEn(booking.checkIn),
      checkOutText: formatDateEn(booking.checkOut),
      cancellationDeadlineKst: formatCancellationDeadlineKst(booking.cancellationDeadlineKst),
      createdAt: booking.createdAt.toISOString(),
      confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[api/bookings/public/:token] failed to fetch booking", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch booking");
  }
}
