import { apiError, apiOk } from "@/lib/api/response";
import { formatCancellationDeadlineKst, formatDateEn, formatUsdFromCents } from "@/lib/bookings/utils";
import { findPublicBookingByToken } from "@/lib/repositories/bookings";
import { cancelGuestBookingByToken } from "@/lib/repositories/payment-processing";

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

    // TODO: PAYMENT_PROVIDER=PORTONE일 때 PG 취소/환불 API 호출 (현재 MOCK은 DB 상태만 변경)
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

    return apiOk({
      token: booking.publicToken,
      status: booking.status,
      listing: booking.listing,
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
